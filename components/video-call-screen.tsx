"use client";

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import DailyIframe, { DailyCall, DailyParticipant } from "@daily-co/daily-js";
import {
  enqueueOrMatch,
  subscribeToMatch,
  leaveMatchQueue,
  requeueSameRoom,
  createOrGetNamedRoom,
  readBlockedUserIds,
  addBlockedUserId,
  type MatchFilters,
  type QueueProfile,
} from "@/lib/match-queue";
import {
  placeDirectCall,
  setDirectCallStatus,
  startCallRingtone,
  stopCallRingtone,
  subscribeDirectCall,
  DIRECT_CALL_RING_MS,
  type DirectCallInvite,
} from "@/lib/direct-call";
import { isRealPiUsername } from "@/lib/real-pi-user";
import { blockUserForMe, readLocalBackgroundPlay, readLocalHideGender } from "@/lib/user-settings";
import { playGiftSound } from "@/lib/gift-sounds";
import {
  incrementGiftsReceived,
  subscribeToUserProfile,
  type UserProfile as FirestoreUserProfile,
} from "@/lib/firestore-service";
import { recordProfileView } from "@/lib/profile-views";
import {
  GiftBurstOverlay,
  GiftPickerPanel,
  CALL_GIFTS,
  resolveGiftId,
  type CallGift,
  type GiftId,
} from "@/components/gift-overlay";
import {
  RemoteProfileAvatar,
  RemoteProfileModal,
  mergeRemoteProfile,
} from "@/components/call-remote-profile";
import { CallReportSheet } from "@/components/call-report-sheet";
import { ShieldAlert } from "lucide-react";
import { YouNeonScriptLogo } from "@/components/youneon-script-logo";
import {
  dailyRoomIdFromUrl,
  submitUserReport,
  type ReportReasonId,
} from "@/lib/safety";
import { loadSafetyModels, scanVideoFrame, safetyLabel, type SafetyModels } from "@/lib/video-safety";

interface PartnerProfile {
  userId?: string;
  name: string;
  avatar?: string;
  age?: number;
  country?: string;
  countryFlag?: string;
  bio?: string;
  interests?: string[];
  gender?: string;
}

interface VideoCallScreenProps {
  onEnd: (info?: { partner: PartnerProfile | null; durationSeconds: number }) => void;
  partnerName?: string;
  partnerProfile?: PartnerProfile;
  currentUserId?: string;
  currentUserName?: string;
  currentUserProfile?: {
    age?: number;
    country?: string;
    gender?: string;
    avatar?: string;
    bio?: string;
    interests?: string[];
  };
  isPremium?: boolean;
  matchMode?: "random" | "direct";
  filters?: MatchFilters;
  roomKey?: string;
  directRole?: "caller" | "callee";
  callId?: string;
}

type FacingMode = "user" | "environment";

type DailyCameraCall = DailyCall & {
  cycleCamera?: () => Promise<unknown>;
  updateInputSettings?: (settings: {
    video?: { settings?: { facingMode?: FacingMode } };
  }) => Promise<unknown>;
  setInputDevicesAsync?: (opts: {
    videoDeviceId?: string | { exact?: string };
    videoSource?: boolean | MediaStreamTrack | { facingMode?: FacingMode | { ideal?: FacingMode } };
  }) => Promise<unknown>;
};

function readFacingMode(track: MediaStreamTrack | undefined | null): FacingMode | null {
  try {
    const mode = track?.getSettings?.()?.facingMode;
    if (mode === "user" || mode === "environment") return mode;
  } catch {
    /* ignore */
  }
  return null;
}
type CallStatus = "idle" | "preview" | "joining" | "waiting" | "joined";

interface ChatMsg { id: string; from: "me" | "partner"; text: string; timestamp: number; }

const SKIP_COOLDOWN_MS = 5000;

function isLiveTrack(track: MediaStreamTrack | undefined | null, kind?: "video" | "audio"): track is MediaStreamTrack {
  return !!track && track.readyState === "live" && (!kind || track.kind === kind);
}

function liveTrackFromStream(stream: MediaStream | null | undefined, kind: "video" | "audio"): MediaStreamTrack | undefined {
  return stream?.getTracks().find((t) => isLiveTrack(t, kind));
}

function localDailyTrack(call: DailyCall | null, kind: "video" | "audio"): MediaStreamTrack | undefined {
  try {
    const track = call?.participants()?.local?.tracks?.[kind]?.persistentTrack;
    return isLiveTrack(track, kind) ? track : undefined;
  } catch {
    return undefined;
  }
}

function watchTrackEnded(track: MediaStreamTrack | undefined | null) {
  if (!track || (track as MediaStreamTrack & { _ynEndedLog?: boolean })._ynEndedLog) return;
  (track as MediaStreamTrack & { _ynEndedLog?: boolean })._ynEndedLog = true;
  track.addEventListener("ended", () => {
    console.log("[cam] track ended", track.kind, track.id);
  });
}

function participantTrack(p: DailyParticipant | undefined, kind: "video" | "audio"): MediaStreamTrack | undefined {
  try {
    const info = p?.tracks?.[kind];
    const state = info?.state;
    if (state === "off" || state === "blocked") return undefined;
    const track =
      (state === "playable" && info?.track) || info?.persistentTrack || info?.track;
    return isLiveTrack(track, kind) ? track : undefined;
  } catch {
    return undefined;
  }
}

function primeVideoEl(el: HTMLVideoElement, muted: boolean) {
  el.autoplay = true;
  el.playsInline = true;
  el.setAttribute("autoplay", "");
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  if (muted) {
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
  }
}

function playMedia(el: HTMLMediaElement) {
  const play = el.play();
  if (play && typeof play.catch === "function") play.catch(() => {});
}

function attachVideoEl(el: HTMLVideoElement | null, track: MediaStreamTrack | undefined, muted = true) {
  if (!el || !isLiveTrack(track, "video")) return false;
  watchTrackEnded(track);
  primeVideoEl(el, muted);
  const cur = el.srcObject as MediaStream | null;
  if (cur?.getVideoTracks()[0] !== track) {
    el.srcObject = new MediaStream([track]);
  }
  playMedia(el);
  return true;
}

function attachAudioEl(el: HTMLAudioElement | null, track: MediaStreamTrack | undefined) {
  if (!el || !isLiveTrack(track, "audio")) return false;
  el.autoplay = true;
  el.setAttribute("autoplay", "");
  const cur = el.srcObject as MediaStream | null;
  if (cur?.getAudioTracks()[0] !== track) {
    el.srcObject = new MediaStream([track]);
  }
  playMedia(el);
  return true;
}

function setTrackEnabled(track: MediaStreamTrack | undefined, enabled: boolean) {
  if (!isLiveTrack(track)) return;
  if (track.enabled !== enabled) track.enabled = enabled;
}

const SAFETY_CHECK_MS = 1400;
const SAFETY_HITS_NEEDED = 2;

type CallIconName = "mic" | "micOff" | "cam" | "camOff" | "chat" | "gift" | "skip" | "end" | "flip";

function CallIcon({
  name,
  uid,
  size = 21,
  tone,
}: {
  name: CallIconName;
  uid?: string;
  size?: number;
  tone?: "neon" | "plain";
}) {
  const gid = `yn-stroke-${uid || name}`;
  const off = name === "micOff" || name === "camOff" || name === "end";
  const stroke = tone === "plain" || off ? "currentColor" : `url(#${gid})`;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="3" y1="2" x2="21" y2="22">
          <stop stopColor="#c084fc" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="var(--pink)" />
        </linearGradient>
        <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.55" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${gid}-glow)`}
      >
        {(name === "mic" || name === "micOff") && (
          <>
            <path d="M12 3.6c-1.55 0-2.75 1.2-2.75 2.75v5.1c0 1.55 1.2 2.75 2.75 2.75s2.75-1.2 2.75-2.75v-5.1c0-1.55-1.2-2.75-2.75-2.75z" />
            <path d="M7.35 11.6a4.65 4.65 0 0 0 9.3 0" />
            <path d="M12 16.25v3.4M9.2 19.65h5.6" />
            {name === "micOff" && <path d="M5 18.8 19 5.2" />}
          </>
        )}
        {(name === "cam" || name === "camOff") && (
          <>
            <rect x="3.4" y="6.4" width="11.6" height="11.2" rx="2.4" />
            <path d="M15 10.2 20.4 7.4v9.2L15 13.8z" />
            <circle cx="9.1" cy="12" r="1.85" />
            {name === "camOff" && <path d="M4.2 19.2 19.8 4.8" />}
          </>
        )}
        {name === "chat" && (
          <>
            <path d="M5.2 7.1c0-1.5 1.2-2.7 2.7-2.7h8.2c1.5 0 2.7 1.2 2.7 2.7v5.4c0 1.5-1.2 2.7-2.7 2.7h-5.1L7.2 18.8v-3.6H7.9c-1.5 0-2.7-1.2-2.7-2.7z" />
            <circle cx="9.2" cy="9.8" r="0.85" fill={stroke} stroke="none" />
            <circle cx="12" cy="9.8" r="0.85" fill={stroke} stroke="none" />
            <circle cx="14.8" cy="9.8" r="0.85" fill={stroke} stroke="none" />
          </>
        )}
        {name === "gift" && (
          <>
            <rect x="4.2" y="10.6" width="15.6" height="8.8" rx="1.6" />
            <path d="M4.2 10.6h15.6V8.3H4.2z" />
            <path d="M12 8.3v11.1" />
            <path d="M12 8.3c-.1-2.2-1.7-3.6-3.15-3.6-1.2 0-1.85 1.05-.7 2.45C9.6 8.7 12 8.3 12 8.3z" />
            <path d="M12 8.3c.1-2.2 1.7-3.6 3.15-3.6 1.2 0 1.85 1.05.7 2.45C14.4 8.7 12 8.3 12 8.3z" />
          </>
        )}
        {name === "skip" && (
          <>
            <path d="M5.4 7.2 13.2 12 5.4 16.8z" />
            <path d="M16.7 7.15v9.7" />
          </>
        )}
        {name === "end" && (
          <>
            <path d="M7.2 14.8c3.2 2.15 6.4 2.15 9.6 0" strokeWidth="2.05" />
            <path d="M5.5 12.55c.2.85.95 1.45 1.9 1.45h1.05M18.5 12.55c-.2.85-.95 1.45-1.9 1.45h-1.05" strokeWidth="2.05" />
          </>
        )}
        {name === "flip" && (
          <>
            <path d="M16.6 5.2 19.2 7.6 16.6 10" />
            <path d="M19.2 7.6H9.4a4.4 4.4 0 0 0-4.2 5.7" />
            <path d="M7.4 18.8 4.8 16.4 7.4 14" />
            <path d="M4.8 16.4h9.8a4.4 4.4 0 0 0 4.2-5.7" />
          </>
        )}
      </g>
    </svg>
  );
}

function WaitSticker({ src }: { src: string }) {
  return <img src={src} alt="" width={52} height={52} draggable={false} />;
}

function WaitingMatchPanel({
  title,
  subtitle,
  premium,
  videoRef,
  camOn = true,
}: {
  title: string;
  subtitle: string;
  premium?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  camOn?: boolean;
}) {
  return (
    <div className="yn-wait-overlay">
      <header className="yn-wait-header">
        <div className="yn-wait-brand">
          <YouNeonScriptLogo className="yn-wait-logo" />
        </div>
        <p className="yn-wait-online">
          <span className="yn-wait-online-dot" />
          Online
        </p>
      </header>
      <div className="yn-wait-center">
        <div className="yn-wait-radar" aria-hidden="true">
          <svg className="yn-wait-scan" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="yn-wait-scan-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5d76e" stopOpacity="0" />
                <stop offset="55%" stopColor="#e879f9" stopOpacity="0.2" />
                <stop offset="88%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#f5d76e" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="93"
              fill="none"
              stroke="url(#yn-wait-scan-stroke)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="36 548"
            />
          </svg>
          <span className="yn-wait-sat yn-wait-sat-1"><WaitSticker src="/wait/heart.png" /></span>
          <span className="yn-wait-sat yn-wait-sat-2"><WaitSticker src="/wait/bolt.png" /></span>
          <span className="yn-wait-sat yn-wait-sat-3"><WaitSticker src="/wait/star.png" /></span>
          <span className="yn-wait-sat yn-wait-sat-4"><WaitSticker src="/wait/flame.png" /></span>
          <div className="yn-wait-self">
            <div className="yn-wait-self-inner">
              <span className="yn-wait-self-fallback">
                <CallIcon name="cam" uid="wait-hero" size={36} />
              </span>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`yn-wait-self-video${camOn ? "" : " is-off"}`}
              />
            </div>
          </div>
        </div>
        {premium && <p className="yn-wait-priority">Priority matching</p>}
        <p className="yn-wait-title">
          {title}
          <span className="yn-wait-dots" aria-hidden="true" />
        </p>
        <p className="yn-wait-sub">{subtitle}</p>
      </div>
    </div>
  );
}

function VideoCallScreen({
  onEnd,
  partnerName,
  partnerProfile,
  currentUserId,
  currentUserName,
  currentUserProfile,
  isPremium = false,
  matchMode = "random",
  filters,
  roomKey,
  directRole = "caller",
  callId,
}: VideoCallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const waitCamRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const roomUrlRef = useRef("");
  const giftLogRef = useRef<Array<{ giftId: string; emoji?: string; direction: "sent" | "received"; timestamp: number }>>([]);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const cameraStartLockRef = useRef(false);
  const facingModeRef = useRef<FacingMode>("user");
  const flipLockRef = useRef(false);
  const meetingJoinedRef = useRef(false);
  const safetyModelsRef = useRef<SafetyModels | null>(null);
  const safetyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyHitsRef = useRef(0);
  const sessionStartedRef = useRef(Date.now());
  const hadRemoteRef = useRef(false);
  const partnerRef = useRef<PartnerProfile | null>(partnerProfile || (partnerName ? { name: partnerName } : null));
  const directInviteRef = useRef<DirectCallInvite | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);
  const matchOptsRef = useRef({
    currentUserId,
    currentUserName,
    currentUserProfile,
    isPremium,
    matchMode,
    filters,
    roomKey,
    partnerProfile,
    directRole,
    callId,
  });
  matchOptsRef.current = {
    currentUserId,
    currentUserName,
    currentUserProfile,
    isPremium,
    matchMode,
    filters,
    roomKey,
    partnerProfile,
    directRole,
    callId,
  };

  const [permission, setPermission] = useState<PermissionState>("checking");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [browser, setBrowser] = useState<"chrome" | "edge" | "firefox" | "other">("other");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const camOnRef = useRef(true);
  const micOnRef = useRef(true);
  const [remoteName, setRemoteName] = useState<string>("");
  const [partner, setPartner] = useState<PartnerProfile | null>(
    partnerProfile || (partnerName ? { name: partnerName } : null)
  );

  const [sessionId, setSessionId] = useState(0);
  const [skipRemaining, setSkipRemaining] = useState(SKIP_COOLDOWN_MS / 1000);

  const currentPartner: PartnerProfile = partner || { name: "Partner" };
  partnerRef.current = partner;

  const [showChatInput, setShowChatInput] = useState(false);
  const [chatInputValue, setChatInputValue] = useState("");
  const [displayedMessage, setDisplayedMessage] = useState<ChatMsg | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [giftBurst, setGiftBurst] = useState<{ key: string; giftId: GiftId } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [remoteUserDoc, setRemoteUserDoc] = useState<FirestoreUserProfile | null>(null);

  const [nsfwBlur, setNsfwBlur] = useState(false);
  const [nsfwReason, setNsfwReason] = useState<string>("");
  const [bypassNsfw, setBypassNsfw] = useState(false);
  const [safetyReady, setSafetyReady] = useState(false);
  const bypassTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg/")) setBrowser("edge");
    else if (ua.includes("chrome")) setBrowser("chrome");
    else if (ua.includes("firefox")) setBrowser("firefox");
    else setBrowser("other");
  }, []);

  const stopCamera = useCallback((reason: string) => {
    console.log("[cam] stopCamera", reason);
    const call = callRef.current;
    const dailyTracks = [
      call?.participants()?.local?.tracks?.video?.persistentTrack,
      call?.participants()?.local?.tracks?.audio?.persistentTrack,
    ];
    dailyTracks.forEach((t) => {
      if (t && t.readyState !== "ended") t.stop();
    });
    const stream = previewStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => {
        if (t.readyState !== "ended") t.stop();
      });
      previewStreamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (reason: string, call?: DailyCall | null) => {
    const existing =
      liveTrackFromStream(previewStreamRef.current, "video") ||
      localDailyTrack(call || callRef.current, "video");
    if (existing) {
      console.log("[cam] startCamera skipped (track live)", reason, existing.id);
      watchTrackEnded(existing);
      const facing = readFacingMode(existing) || facingModeRef.current;
      facingModeRef.current = facing;
      setFacingMode(facing);
      return existing;
    }
    if (cameraStartLockRef.current) {
      console.log("[cam] startCamera skipped (in flight)", reason);
      return undefined;
    }
    cameraStartLockRef.current = true;
    console.log("[cam] startCamera", reason);
    try {
      if (call) {
        await call.startCamera();
        const fromDaily = localDailyTrack(call, "video");
        if (fromDaily) {
          watchTrackEnded(fromDaily);
          const facing = readFacingMode(fromDaily) || facingModeRef.current;
          facingModeRef.current = facing;
          setFacingMode(facing);
        }
        return fromDaily;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: true,
      });
      previewStreamRef.current = stream;
      stream.getTracks().forEach((t) => watchTrackEnded(t));
      const video = liveTrackFromStream(stream, "video");
      const facing = readFacingMode(video) || "user";
      facingModeRef.current = facing;
      setFacingMode(facing);
      return video;
    } catch (err) {
      console.error("[cam] startCamera failed", reason, err);
      throw err;
    } finally {
      cameraStartLockRef.current = false;
    }
  }, []);

  const checkPermissions = async () => {
    setPermission("checking");
    setErrorMsg("");
    try {
      const live = liveTrackFromStream(previewStreamRef.current, "video");
      if (live) {
        setPermission("granted");
        return;
      }
      await startCamera("permission-check");
      setPermission("granted");
    } catch (err: any) {
      const name = err?.name || "";
      console.error("getUserMedia failed:", name);
      if (name === "NotAllowedError" || name === "PermissionDeniedError") setPermission("denied");
      else if (name === "NotFoundError" || name === "DevicesNotFoundError") setPermission("not-found");
      else if (name === "NotReadableError" || name === "TrackStartError") setPermission("in-use");
      else { setPermission("error"); setErrorMsg(err?.message || "Unknown error"); }
    }
  };

  useEffect(() => { checkPermissions(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const models = await loadSafetyModels();
        if (cancelled) return;
        safetyModelsRef.current = models;
        setSafetyReady(true);
      } catch (e) {
        console.warn("[safety] models failed to load", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerGiftBurst = useCallback((giftId: GiftId) => {
    setGiftBurst({ key: `${Date.now()}-${giftId}`, giftId });
    playGiftSound(giftId);
  }, []);

  const clearGiftBurst = useCallback(() => setGiftBurst(null), []);

  const saveReceivedGift = useCallback((giftId: string, giftEmoji: string, fromName: string) => {
    try {
      const userId = currentUserId || "anon";
      const key = `younn-received-gifts-${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({ id: giftId, emoji: giftEmoji, from: fromName, timestamp: Date.now() });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) { console.warn(e); }
  }, [currentUserId]);

  const showIncomingMessage = useCallback((msg: ChatMsg) => {
    setDisplayedMessage(msg);
    setChatHistory((prev) => [...prev, msg]);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setDisplayedMessage(null), 10000);
  }, []);

  const saveReceivedGiftRef = useRef(saveReceivedGift);
  saveReceivedGiftRef.current = saveReceivedGift;
  const showIncomingMessageRef = useRef(showIncomingMessage);
  showIncomingMessageRef.current = showIncomingMessage;
  const triggerGiftBurstRef = useRef(triggerGiftBurst);
  triggerGiftBurstRef.current = triggerGiftBurst;

  useEffect(() => {
    if (permission !== "granted") return;
    const track =
      liveTrackFromStream(previewStreamRef.current, "video") ||
      localDailyTrack(callRef.current, "video");
    attachVideoEl(localVideoRef.current, track, true);
    attachVideoEl(waitCamRef.current, track, true);
  }, [permission, callStatus]);

  useEffect(() => {
    if (callStatus !== "joined" || !safetyReady || bypassNsfw || nsfwBlur) {
      if (safetyIntervalRef.current) clearInterval(safetyIntervalRef.current);
      safetyHitsRef.current = 0;
      return;
    }
    const checkFrame = async () => {
      const video = remoteVideoRef.current;
      const models = safetyModelsRef.current;
      if (!video || !models) return;
      try {
        const hit = await scanVideoFrame(video, models);
        if (hit) {
          safetyHitsRef.current += 1;
          if (safetyHitsRef.current >= SAFETY_HITS_NEEDED) {
            setNsfwReason(safetyLabel(hit.reason));
            setNsfwBlur(true);
          }
        } else {
          safetyHitsRef.current = 0;
        }
      } catch {
        /* keep the call going if a frame fails */
      }
    };
    void checkFrame();
    safetyIntervalRef.current = setInterval(checkFrame, SAFETY_CHECK_MS);
    return () => {
      if (safetyIntervalRef.current) clearInterval(safetyIntervalRef.current);
    };
  }, [callStatus, bypassNsfw, sessionId, safetyReady, nsfwBlur]);

  const updateMediaElements = useCallback((call: DailyCall) => {
    const participants = call.participants();
    let remoteCount = 0;
    Object.values(participants).forEach((p: DailyParticipant) => {
      if (p.local) {
        const videoTrack = participantTrack(p, "video") || localDailyTrack(call, "video");
        const audioTrack = participantTrack(p, "audio") || localDailyTrack(call, "audio");
        setTrackEnabled(videoTrack, camOnRef.current);
        setTrackEnabled(audioTrack, micOnRef.current);
        attachVideoEl(localVideoRef.current, videoTrack, true);
        attachVideoEl(waitCamRef.current, videoTrack, true);
        if (camOnRef.current && p.tracks?.video?.state === "off") {
          void call.setLocalVideo(true).catch(() => {});
        }
        if (micOnRef.current && p.tracks?.audio?.state === "off") {
          void call.setLocalAudio(true).catch(() => {});
        }
      } else {
        remoteCount++;
        setRemoteName((prev) => {
          const next = p.user_name || "Partner";
          return prev === next ? prev : next;
        });
        const remoteUserId = (p.userData as { userId?: string } | undefined)?.userId;
        if (remoteUserId) {
          setPartner((prev) => {
            if (prev?.userId === remoteUserId) return prev;
            return {
              name: prev?.name || p.user_name || "Partner",
              ...prev,
              userId: prev?.userId || remoteUserId,
            };
          });
        }
        const videoState = p.tracks?.video?.state;
        if (
          p.tracks?.video?.subscribed === false ||
          p.tracks?.audio?.subscribed === false ||
          videoState === "loading" ||
          videoState === "interrupted"
        ) {
          try {
            call.updateParticipant(p.session_id, { setSubscribedTracks: true });
          } catch {
            /* older daily-js */
          }
        }
        attachVideoEl(remoteVideoRef.current, participantTrack(p, "video"), true);
        attachAudioEl(remoteAudioRef.current, participantTrack(p, "audio"));
      }
    });
    if (remoteCount > 0) {
      hadRemoteRef.current = true;
      stopRingRef.current?.();
      stopRingRef.current = null;
      const invite = directInviteRef.current;
      if (invite && invite.status === "ringing") {
        directInviteRef.current = { ...invite, status: "accepted" };
        void setDirectCallStatus(invite, "accepted");
      }
      setCallStatus((s) => (s === "joined" ? s : "joined"));
    } else if (meetingJoinedRef.current) {
      setCallStatus((s) => (s === "waiting" ? s : "waiting"));
      if (hadRemoteRef.current && matchOptsRef.current.matchMode === "random") {
        hadRemoteRef.current = false;
        setPartner(null);
        const uid = matchOptsRef.current.currentUserId || "";
        if (isRealPiUsername(uid)) requeueSameRoom(uid).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    let cancelled = false;
    let unsubMatch: (() => void) | undefined;
    let unsubDirect: (() => void) | undefined;
    const opts = matchOptsRef.current;
    const userId = opts.currentUserId || "";
    sessionStartedRef.current = Date.now();
    hadRemoteRef.current = false;
    meetingJoinedRef.current = false;

    if (opts.matchMode === "random" && !isRealPiUsername(userId)) {
      setPermission("error");
      setErrorMsg("Sign in with Pi Network to start a video chat.");
      return;
    }

    const start = async () => {
      try {
        setCallStatus("preview");
        setSkipRemaining(SKIP_COOLDOWN_MS / 1000);
        setNsfwBlur(false);
        setBypassNsfw(false);
        setRemoteName("");
        setCamOn(true);
        setMicOn(true);
        camOnRef.current = true;
        micOnRef.current = true;
        giftLogRef.current = [];
        roomUrlRef.current = "";
        if (opts.matchMode === "direct" && opts.partnerProfile) setPartner(opts.partnerProfile);
        else if (opts.matchMode === "random") setPartner(opts.partnerProfile || null);

        attachVideoEl(
          localVideoRef.current,
          liveTrackFromStream(previewStreamRef.current, "video")
        );

        let url = "";
        if (opts.matchMode === "direct") {
          setCallStatus("joining");
          const room = await createOrGetNamedRoom(opts.roomKey || `direct-${userId}`);
          url = room.url;
          const calleeId = opts.partnerProfile?.userId || "";
          if (opts.directRole !== "callee" && calleeId && userId && calleeId !== userId) {
            try {
              const id = await placeDirectCall({
                callerId: userId,
                callerName: opts.currentUserName || "Someone",
                callerPhoto: opts.currentUserProfile?.avatar,
                calleeId,
                calleeName: opts.partnerProfile?.name,
                roomKey: opts.roomKey || `direct-${userId}`,
                conversationId: opts.roomKey,
              });
              const invite: DirectCallInvite = {
                id,
                callerId: userId,
                callerName: opts.currentUserName || "Someone",
                calleeId,
                roomKey: opts.roomKey || `direct-${userId}`,
                status: "ringing",
                createdAtMs: Date.now(),
              };
              directInviteRef.current = invite;
              stopRingRef.current = startCallRingtone(false);
              unsubDirect = subscribeDirectCall(userId, id, (live) => {
                if (!live || cancelled) return;
                if (live.status === "declined" || live.status === "missed") {
                  stopRingRef.current?.();
                  stopRingRef.current = null;
                  setErrorMsg(
                    live.status === "declined"
                      ? `${opts.partnerProfile?.name || "They"} declined the call`
                      : "No answer"
                  );
                  setPermission("error");
                }
              });
              window.setTimeout(() => {
                const live = directInviteRef.current;
                if (!live || live.id !== id || live.status !== "ringing" || cancelled) return;
                void setDirectCallStatus(live, "missed");
              }, DIRECT_CALL_RING_MS);
            } catch (ringErr) {
              console.warn("[direct-call] place failed", ringErr);
            }
          }
        } else {
          const match = await enqueueOrMatch({
            userId,
            profile: {
              userId,
              name: opts.currentUserName || "Me",
              avatar: opts.currentUserProfile?.avatar,
              age: opts.currentUserProfile?.age,
              country: opts.currentUserProfile?.country,
              gender: readLocalHideGender() ? "" : opts.currentUserProfile?.gender,
              bio: opts.currentUserProfile?.bio,
              interests: opts.currentUserProfile?.interests,
            } satisfies QueueProfile,
            filters: opts.filters || { gender: "both", country: "Worldwide" },
            blockedIds: readBlockedUserIds(userId),
            isPremium: opts.isPremium,
          });
          if (cancelled) {
            await leaveMatchQueue(userId);
            return;
          }
          url = match.roomUrl;
          if (match.partner) setPartner(match.partner);
          unsubMatch = subscribeToMatch(userId, (update) => {
            if (update.partner) setPartner(update.partner);
          });
        }
        if (!url) throw new Error("No room URL");
        roomUrlRef.current = url;
        if (cancelled) return;

        setCallStatus("joining");
        const videoTrack = liveTrackFromStream(previewStreamRef.current, "video")
          || localDailyTrack(callRef.current, "video");
        const audioTrack = liveTrackFromStream(previewStreamRef.current, "audio")
          || localDailyTrack(callRef.current, "audio");
        if (videoTrack) {
          console.log("[cam] reusing live track for Daily", "daily-join", videoTrack.id);
        }

        const callObject = DailyIframe.createCallObject({
          subscribeToTracksAutomatically: true,
          audioSource: audioTrack || true,
          videoSource: videoTrack || true,
          ...(videoTrack
            ? {}
            : {
                inputSettings: {
                  video: { settings: { facingMode: "user" as const } },
                },
              }),
        } as Parameters<typeof DailyIframe.createCallObject>[0]);
        callRef.current = callObject;
        const refresh = () => updateMediaElements(callObject);
        callObject.on("joined-meeting", () => {
          meetingJoinedRef.current = true;
          console.log("[cam] meeting joined");
          void callObject.setLocalVideo(camOnRef.current).catch(() => {});
          void callObject.setLocalAudio(micOnRef.current).catch(() => {});
          refresh();
        });
        callObject.on("left-meeting", () => {
          meetingJoinedRef.current = false;
          console.log("[cam] meeting left");
        });
        callObject.on("participant-joined", refresh);
        callObject.on("participant-updated", refresh);
        callObject.on("participant-left", refresh);
        callObject.on("track-started", (ev: { track?: MediaStreamTrack; participant?: { local?: boolean } }) => {
          const track = ev?.track;
          const local = !!ev?.participant?.local;
          if (track?.kind === "video") {
            watchTrackEnded(track);
            if (local) {
              attachVideoEl(localVideoRef.current, track, true);
              attachVideoEl(waitCamRef.current, track, true);
            } else {
              attachVideoEl(remoteVideoRef.current, track, true);
            }
          } else if (track?.kind === "audio" && !local) {
            attachAudioEl(remoteAudioRef.current, track);
          }
          refresh();
        });
        callObject.on("track-stopped", (ev: { track?: MediaStreamTrack; participant?: { local?: boolean } }) => {
          if (ev?.track?.kind === "video") {
            console.log("[cam] track ended", {
              local: !!ev.participant?.local,
              id: ev.track.id,
              state: ev.track.readyState,
            });
          }
          refresh();
        });
        callObject.on("network-connection", () => {
          const live = localDailyTrack(callObject, "video")
            || liveTrackFromStream(previewStreamRef.current, "video");
          if (live) {
            console.log("[cam] startCamera skipped (track live)", "reconnect", live.id);
            attachVideoEl(localVideoRef.current, live, true);
            void callObject.setLocalVideo(camOnRef.current).catch(() => {});
            void callObject.setLocalAudio(micOnRef.current).catch(() => {});
            refresh();
            return;
          }
        });
        callObject.on("app-message", (event: any) => {
          const d = event?.data;
          if (!d || !d.type) return;
          if (d.type === "chat" && d.text) {
            showIncomingMessageRef.current({
              id: `msg-${Date.now()}-${Math.random()}`,
              from: "partner", text: String(d.text).slice(0, 200), timestamp: Date.now(),
            });
          } else if (d.type === "gift") {
            const giftId = resolveGiftId(d.giftId, d.emoji);
            if (!giftId) return;
            triggerGiftBurstRef.current(giftId);
            const meta = CALL_GIFTS.find((g) => g.id === giftId);
            giftLogRef.current.push({
              giftId,
              emoji: meta?.emoji || String(d.emoji || ""),
              direction: "received",
              timestamp: Date.now(),
            });
            saveReceivedGiftRef.current(giftId, meta?.emoji || String(d.emoji || ""), partnerRef.current?.name || "Partner");
          }
        });

        try {
          await callObject.startCamera({
            startVideoOff: false,
            startAudioOff: false,
            audioSource: audioTrack || true,
            videoSource: videoTrack || true,
          } as Parameters<DailyCall["startCamera"]>[0]);
        } catch (camErr) {
          console.warn("[cam] daily startCamera", camErr);
          if (!videoTrack) {
            await startCamera("daily-join", callObject);
          }
        }

        await callObject.join({
          url,
          userName: opts.currentUserName || "Me",
          userData: { userId },
          startVideoOff: false,
          startAudioOff: false,
        });
        try {
          await callObject.setLocalVideo(true);
          await callObject.setLocalAudio(true);
        } catch (mediaErr) {
          console.warn("[cam] setLocal media", mediaErr);
        }
        refresh();
      } catch (err: any) {
        console.error("Daily start failed:", err);
        if (!cancelled) { setPermission("error"); setErrorMsg(err?.message || "Could not start video"); }
      }
    };
    start();
    return () => {
      cancelled = true;
      unsubMatch?.();
      unsubDirect?.();
      stopRingRef.current?.();
      stopRingRef.current = null;
      const invite = directInviteRef.current;
      if (invite && invite.status === "ringing") {
        void setDirectCallStatus(invite, "canceled");
        directInviteRef.current = { ...invite, status: "canceled" };
      }
      if (opts.matchMode === "random") leaveMatchQueue(userId).catch(() => {});
      setDisplayedMessage(null); setChatHistory([]); setGiftBurst(null);
      setShowChatInput(false); setShowHistory(false); setShowGiftPicker(false);
      setShowProfile(false); setRemoteUserDoc(null); setRemoteName(""); setNsfwBlur(false); setBypassNsfw(false);
      if (bypassTimerRef.current) clearTimeout(bypassTimerRef.current);
      if (callRef.current) {
        console.log("[cam] meeting left");
        callRef.current.leave().catch(() => {});
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
      meetingJoinedRef.current = false;
    };
  }, [permission, sessionId, updateMediaElements, startCamera, stopCamera]);

  useEffect(() => {
    if (callStatus === "idle" || callStatus === "preview") return;
    const tick = () => {
      const call = callRef.current;
      if (call) updateMediaElements(call);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [callStatus, updateMediaElements]);

  useEffect(() => {
    return () => stopCamera("unmount");
  }, [stopCamera]);

  useEffect(() => {
    camOnRef.current = camOn;
  }, [camOn]);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  useEffect(() => {
    if (callStatus !== "joined" && callStatus !== "waiting" && callStatus !== "joining") return;
    const onVis = () => {
      const call = callRef.current;
      if (!call || !readLocalBackgroundPlay()) return;
      const video = localDailyTrack(call, "video")
        || liveTrackFromStream(previewStreamRef.current, "video");
      if (!isLiveTrack(video, "video")) {
        console.log("[cam] startCamera skipped (no live track to toggle)", "visibility");
        return;
      }
      setTrackEnabled(video, document.hidden ? false : camOnRef.current);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [callStatus]);

  useEffect(() => {
    const userId = partner?.userId;
    if (!userId || userId === "anon") {
      setRemoteUserDoc(null);
      return;
    }
    return subscribeToUserProfile(userId, setRemoteUserDoc);
  }, [partner?.userId]);

  useEffect(() => {
    const viewedId = partner?.userId;
    if (!currentUserId || !viewedId || viewedId === "anon" || viewedId === currentUserId) return;
    void recordProfileView({
      viewerId: currentUserId,
      viewedUserId: viewedId,
      viewerName: currentUserName,
      viewerPhoto: currentUserProfile?.avatar,
      viewerCountry: currentUserProfile?.country,
    });
  }, [
    currentUserId,
    currentUserName,
    currentUserProfile?.avatar,
    currentUserProfile?.country,
    partner?.userId,
  ]);

  useEffect(() => {
    if (!partner) {
      setShowProfile(false);
      setRemoteUserDoc(null);
    }
  }, [partner]);

  useEffect(() => {
    if (callStatus !== "joined" && callStatus !== "waiting") {
      setSkipRemaining(SKIP_COOLDOWN_MS / 1000);
      return;
    }
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setSkipRemaining(Math.max(0, Math.ceil((SKIP_COOLDOWN_MS - elapsed) / 1000)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [callStatus, sessionId]);

  const sendChatMessage = () => {
    const text = chatInputValue.trim();
    if (!text || !callRef.current) return;
    callRef.current.sendAppMessage({ type: "chat", text }, "*");
    const myMsg: ChatMsg = { id: `msg-${Date.now()}-${Math.random()}`, from: "me", text, timestamp: Date.now() };
    setChatHistory((prev) => [...prev, myMsg]);
    setDisplayedMessage(myMsg);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setDisplayedMessage(null), 10000);
    setChatInputValue(""); setShowChatInput(false);
  };

  const sendGift = (gift: CallGift) => {
    try {
      callRef.current?.sendAppMessage({ type: "gift", giftId: gift.id, emoji: gift.emoji }, "*");
    } catch (e) {
      console.warn(e);
    }
    triggerGiftBurst(gift.id);
    giftLogRef.current.push({
      giftId: gift.id,
      emoji: gift.emoji,
      direction: "sent",
      timestamp: Date.now(),
    });
    setShowGiftPicker(false);
    const recipientId = partnerRef.current?.userId;
    if (recipientId) {
      incrementGiftsReceived(recipientId, {
        fromId: currentUserId,
        fromName: currentUserName,
        fromPhoto: currentUserProfile?.avatar,
        giftId: gift.id,
        giftEmoji: gift.emoji,
      });
    }
  };

  const closeProfile = useCallback(() => setShowProfile(false), []);
  const openProfile = useCallback(() => {
    setShowProfile(true);
    setShowGiftPicker(false);
    setShowChatInput(false);
    setShowHistory(false);
  }, []);

  const remotePreview = mergeRemoteProfile(remoteUserDoc, partner, remoteName);

  const toggleCam = () => {
    const next = !camOn;
    const track = localDailyTrack(callRef.current, "video")
      || liveTrackFromStream(previewStreamRef.current, "video");
    if (!isLiveTrack(track, "video")) return;
    setTrackEnabled(track, next);
    camOnRef.current = next;
    setCamOn(next);
  };

  const toggleMic = () => {
    const next = !micOn;
    const track = localDailyTrack(callRef.current, "audio")
      || liveTrackFromStream(previewStreamRef.current, "audio");
    if (!isLiveTrack(track, "audio")) return;
    setTrackEnabled(track, next);
    micOnRef.current = next;
    setMicOn(next);
  };

  const flipCamera = async () => {
    if (!isPremium || flipLockRef.current) return;
    const call = callRef.current as DailyCameraCall | null;
    const currentTrack =
      localDailyTrack(call, "video") || liveTrackFromStream(previewStreamRef.current, "video");
    const current = readFacingMode(currentTrack) || facingModeRef.current;
    const next: FacingMode = current === "user" ? "environment" : "user";
    if (current === next) {
      console.log("[cam] startCamera skipped (already facing)", next);
      return;
    }

    flipLockRef.current = true;
    console.log("[cam] startCamera", "flip", next);
    try {
      if (call && typeof call.cycleCamera === "function") {
        await call.cycleCamera();
      } else if (call && typeof call.updateInputSettings === "function") {
        await call.updateInputSettings({ video: { settings: { facingMode: next } } });
      } else if (call && typeof call.setInputDevicesAsync === "function") {
        await call.setInputDevicesAsync({
          videoSource: { facingMode: { ideal: next } },
        });
      } else {
        console.log("[cam] startCamera skipped (no flip API)", "flip");
        return;
      }

      const flipped =
        localDailyTrack(call, "video") || liveTrackFromStream(previewStreamRef.current, "video");
      const applied = readFacingMode(flipped) || next;
      facingModeRef.current = applied;
      setFacingMode(applied);
      if (isLiveTrack(flipped, "video")) {
        watchTrackEnded(flipped);
        attachVideoEl(localVideoRef.current, flipped, true);
        if (!camOnRef.current) setTrackEnabled(flipped, false);
      }
    } catch (err) {
      console.error("[cam] startCamera failed", "flip", err);
    } finally {
      flipLockRef.current = false;
    }
  };

  const skipToNext = () => {
    if (skipRemaining > 0) return;
    if (callStatus !== "joined" && callStatus !== "waiting") return;
    if (matchMode === "direct") return;
    setPartner(null);
    setSessionId((s) => s + 1);
  };

  const handleEnd = async () => {
    const userId = currentUserId || "anon";
    stopRingRef.current?.();
    stopRingRef.current = null;
    const invite = directInviteRef.current;
    if (invite && (invite.status === "ringing" || invite.status === "accepted")) {
      void setDirectCallStatus(invite, invite.status === "ringing" ? "canceled" : "canceled");
      directInviteRef.current = { ...invite, status: "canceled" };
    }
    if (matchMode === "random") await leaveMatchQueue(userId).catch(() => {});
    if (callRef.current) {
      console.log("[cam] meeting left");
      await callRef.current.leave().catch(() => {});
    }
    stopCamera("end-call");
    onEnd({
      partner: partnerRef.current,
      durationSeconds: Math.max(0, Math.floor((Date.now() - sessionStartedRef.current) / 1000)),
    });
  };

  const handleSeeAnyway = () => {
    safetyHitsRef.current = 0;
    setNsfwBlur(false);
    setBypassNsfw(true);
    if (bypassTimerRef.current) clearTimeout(bypassTimerRef.current);
    bypassTimerRef.current = setTimeout(() => setBypassNsfw(false), 30000);
  };

  const leavePartner = () => {
    safetyHitsRef.current = 0;
    setNsfwBlur(false);
    setShowReport(false);
    setShowProfile(false);
    if (matchMode === "direct") {
      void handleEnd();
      return;
    }
    setPartner(null);
    setSessionId((s) => s + 1);
  };

  const handleBlock = () => {
    const userId = currentUserId || "anon";
    const blockedId = partnerRef.current?.userId;
    if (blockedId) {
      addBlockedUserId(userId, blockedId);
      void blockUserForMe(userId, {
        id: blockedId,
        name: currentPartner.name,
        photo: currentPartner.avatar,
      });
    }
    try {
      const key = `younn-blocked-${userId}`;
      const blocked = JSON.parse(localStorage.getItem(key) || "[]");
      blocked.push({ name: currentPartner.name, id: blockedId, timestamp: Date.now(), reason: nsfwReason });
      localStorage.setItem(key, JSON.stringify(blocked));
    } catch (e) { /* ignore */ }
    leavePartner();
  };

  const handleReportSubmit = async (input: {
    reasonId: ReportReasonId;
    reasonLabel: string;
    notes: string;
    alsoBlock: boolean;
  }) => {
    const reporterId = currentUserId || "anon";
    const reportedUserId = partnerRef.current?.userId || "";
    setReporting(true);
    try {
      if (reportedUserId) {
        await submitUserReport({
          reporterId,
          reportedUserId,
          reportedName: currentPartner.name,
          reasonId: input.reasonId,
          reasonLabel: input.reasonLabel,
          notes: input.notes,
          evidence: {
            roomUrl: roomUrlRef.current,
            roomId: dailyRoomIdFromUrl(roomUrlRef.current),
            chat: chatHistory.map((m) => ({ from: m.from, text: m.text, timestamp: m.timestamp })),
            gifts: giftLogRef.current,
          },
        });
      }
    } catch (e) {
      console.warn("Report failed", e);
    }
    setReporting(false);
    if (input.alsoBlock || !reportedUserId) handleBlock();
    else leavePartner();
  };

  if (permission !== "granted") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-yn-bg p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-fuchsia-200/50 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
        </div>
        <div className="yn-card relative w-full max-w-md rounded-2xl p-6 text-yn-text">
          {permission === "checking" && (
            <div className="flex flex-col items-center py-8">
              <div className="yn-wait-orb mb-5" aria-hidden="true">
                <span className="yn-wait-ring" />
                <span className="yn-wait-ring yn-wait-ring-delay" />
                <span className="yn-wait-core" />
              </div>
              <span className="yn-call-wordmark mb-3 text-2xl">YouNeon</span>
              <p className="text-[15px] text-yn-muted">Checking camera and microphone…</p>
            </div>
          )}
          {permission === "denied" && (
            <>
              <div className="mb-5 text-center">
                <span className="yn-call-wordmark mb-4 inline-block text-2xl">YouNeon</span>
                <h2 className="mb-2 text-xl font-semibold tracking-tight">Camera blocked</h2>
                <p className="text-yn-muted text-sm">Your browser is blocking camera and microphone access. In Pi Browser, allow camera and microphone for this site.</p>
              </div>
              <div className="bg-yn-bg rounded-xl p-4 mb-5 text-sm">
                {browser === "edge" && (
                  <>
                    <p className="font-semibold text-yn-gold mb-2">How to allow in Edge:</p>
                    <ol className="list-decimal list-inside space-y-1 text-yn-text">
                      <li>Tap the <b>lock icon</b> in the address bar</li>
                      <li>Set <b>Camera</b> and <b>Microphone</b> to <b>Allow</b></li>
                      <li>Reload the page</li>
                    </ol>
                  </>
                )}
                {browser === "chrome" && (
                  <>
                    <p className="font-semibold text-yn-gold mb-2">How to allow in Chrome:</p>
                    <ol className="list-decimal list-inside space-y-1 text-yn-text">
                      <li>Tap the <b>lock icon</b></li>
                      <li>Set <b>Camera</b> and <b>Microphone</b> to <b>Allow</b></li>
                      <li>Reload the page</li>
                    </ol>
                  </>
                )}
                {(browser === "firefox" || browser === "other") && (
                  <p>Open site settings and allow camera + microphone. In Pi Browser, use the lock icon or site permissions.</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={checkPermissions} className="yn-cta flex-1 text-white">Try again</button>
                <button onClick={() => onEnd()} className="flex-1 rounded-[14px] border border-black/10 bg-yn-bg py-3 font-semibold">Cancel</button>
              </div>
            </>
          )}
          {(permission === "not-found" || permission === "in-use" || permission === "error") && (
            <>
              <div className="mb-5 text-center">
                <span className="yn-call-wordmark mb-4 inline-block text-2xl">YouNeon</span>
                <h2 className="mb-2 text-xl font-semibold tracking-tight">
                  {permission === "not-found" && "No camera found"}
                  {permission === "in-use" && "Camera is in use"}
                  {permission === "error" && "Something went wrong"}
                </h2>
                <p className="text-yn-muted text-sm break-words">
                  {permission === "not-found" && "Connect a camera and try again."}
                  {permission === "in-use" && "Close Zoom, Teams, or other video apps."}
                  {permission === "error" && errorMsg}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={checkPermissions} className="yn-cta flex-1 text-white">Try again</button>
                <button onClick={() => onEnd()} className="flex-1 rounded-[14px] border border-black/10 bg-yn-bg py-3 font-semibold">Close</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1a0a24]">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full bg-[#1a0a24] object-cover transition-all duration-300 ${nsfwBlur ? "scale-110 blur-3xl" : ""}`}
        data-testid="remote-video"
      />
      <audio ref={remoteAudioRef} autoPlay />
      <div className="yn-call-vignette" />

      {giftBurst && (
        <GiftBurstOverlay
          key={giftBurst.key}
          giftId={giftBurst.giftId}
          burstKey={giftBurst.key}
          onDone={clearGiftBurst}
        />
      )}

      {nsfwBlur && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-red-950/95 to-slate-900/95 backdrop-blur-xl rounded-3xl p-7 max-w-md w-full border-2 border-red-500/40 shadow-2xl text-white">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Video hidden</h2>
              <p className="text-white/70 text-sm">
                Possible <b className="text-red-300">{nsfwReason}</b> was detected. The picture is blurred so you stay safe.
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 mb-5 text-xs text-white/60 text-center">
              Protection runs locally on your device — nothing is sent to a server.
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleBlock} className="w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 h-11 font-semibold text-white" data-testid="block-user-btn">Block and skip</button>
              <button onClick={handleSeeAnyway} className="w-full rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 h-11 text-sm font-medium text-white/80" data-testid="see-anyway-btn">See anyway (30 sec.)</button>
            </div>
          </div>
        </div>
      )}

      <div className={`yn-call-pip${callStatus === "joined" ? "" : " yn-call-pip-hidden"}`}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover${facingMode === "environment" ? "" : " scale-x-[-1]"}`}
          data-testid="local-video"
        />
        {!camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#1f1228]/90 text-xs text-white/80">
            <CallIcon name="camOff" uid="pip-cam" />
            <span>Camera off</span>
          </div>
        )}
        {isPremium && callStatus === "joined" && (
          <button
            type="button"
            onClick={() => void flipCamera()}
            className="absolute left-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-fuchsia-300/40 bg-black/70 text-white backdrop-blur-md active:scale-95"
            aria-label="Switch camera"
            data-testid="flip-camera-btn"
          >
            <CallIcon name="flip" uid="pip-flip" size={14} tone="plain" />
          </button>
        )}
        <div className="absolute bottom-1.5 left-1.5 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/90">You</div>
      </div>

      {displayedMessage && (
        <div
          className="absolute right-4 z-20 max-w-xs"
          style={{ top: "max(12px, env(safe-area-inset-top))", animation: "yn-slide-up 0.3s ease forwards" }}
        >
          <div className={`rounded-2xl backdrop-blur-md px-4 py-3 shadow-2xl border ${
            displayedMessage.from === "me"
              ? "bg-gradient-to-br from-pink-500/90 to-purple-600/90 border-white/30 text-white"
              : "bg-black/70 border-white/20 text-white"
          }`}>
            <p className="text-[10px] opacity-70 mb-1 font-semibold">
              {displayedMessage.from === "me" ? "You" : currentPartner.name}
            </p>
            <p className="text-sm break-words">{displayedMessage.text}</p>
          </div>
        </div>
      )}

      {showHistory && (
        <div
          className="yn-call-glass absolute right-4 z-40 flex max-h-96 w-80 flex-col rounded-2xl"
          style={{ top: "max(12px, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Chat history</span>
            <button onClick={() => setShowHistory(false)} className="text-white/70 hover:text-white text-xl">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-6">No messages yet</p>
            ) : (
              chatHistory.map((m) => (
                <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white" : "bg-white/15 text-white"}`}>{m.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showChatInput && (
        <div className="absolute left-1/2 z-40 w-[90%] max-w-md -translate-x-1/2" style={{ bottom: "calc(96px + env(safe-area-inset-bottom, 0px))", animation: "yn-slide-up 0.25s ease forwards" }}>
          <div className="yn-call-glass flex gap-2 rounded-2xl p-3">
            <input
              type="text" value={chatInputValue} onChange={(e) => setChatInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
              placeholder="Type a message…" autoFocus maxLength={200}
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2 outline-none border border-white/10 focus:border-pink-400"
              data-testid="chat-input"
            />
            <button onClick={sendChatMessage} disabled={!chatInputValue.trim()} className="px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold disabled:opacity-40" data-testid="send-chat-btn">Send</button>
            <button onClick={() => setShowChatInput(false)} className="px-3 rounded-xl bg-white/10 text-white">✕</button>
          </div>
        </div>
      )}

      {showGiftPicker && (
        <GiftPickerPanel onSelect={sendGift} onClose={() => setShowGiftPicker(false)} />
      )}

      <RemoteProfileModal
        open={showProfile}
        onClose={closeProfile}
        firestoreUser={remoteUserDoc}
        hint={partner}
        dailyName={remoteName}
        viewerId={currentUserId}
        standalone
        onReport={() => {
          setShowProfile(false);
          setShowReport(true);
        }}
        onBlock={() => {
          setShowProfile(false);
          handleBlock();
        }}
      />

      {showReport && (
        <CallReportSheet
          userName={currentPartner.name}
          submitting={reporting}
          onClose={() => setShowReport(false)}
          onSubmit={(payload) => void handleReportSubmit(payload)}
        />
      )}

      {callStatus === "preview" && (
        <div className="yn-wait-screen">
          <WaitingMatchPanel
            title={matchMode === "direct" ? `Calling ${partnerProfile?.name || "them"}` : "Finding someone"}
            subtitle={
              matchMode === "direct"
                ? "Ringing their phone…"
                : "Looking for someone in the same room"
            }
            videoRef={waitCamRef}
            camOn={camOn}
          />
        </div>
      )}
      {callStatus === "waiting" && (
        <div className={`yn-wait-screen${showGiftPicker ? " is-gift-hidden" : ""}`}>
          <WaitingMatchPanel
            title={matchMode === "direct" ? `Calling ${currentPartner.name}` : "Finding someone"}
            subtitle={
              matchMode === "direct"
                ? "Waiting for them to answer"
                : isPremium
                  ? "You skip ahead in the queue."
                  : "Stay here — the next person joins this room."
            }
            premium={matchMode === "direct" ? false : isPremium}
            videoRef={waitCamRef}
            camOn={camOn}
          />
        </div>
      )}
      {callStatus === "joining" && (
        <div className="yn-wait-screen">
          <WaitingMatchPanel
            title={matchMode === "direct" ? `Calling ${partnerProfile?.name || "them"}` : "Connecting"}
            subtitle={
              matchMode === "direct"
                ? "Ringing… they get a call with sound."
                : "Opening your camera and microphone."
            }
            videoRef={waitCamRef}
            camOn={camOn}
          />
        </div>
      )}
      {(callStatus === "preview" || callStatus === "joining" || callStatus === "waiting") && (
        <button
          onClick={() => onEnd()}
          className="absolute right-4 z-40 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/16"
          style={{ top: "max(12px, env(safe-area-inset-top))" }}
          aria-label="Cancel matching"
        >
          Cancel
        </button>
      )}

      {callStatus === "joined" && safetyReady && !nsfwBlur && (
        <div
          className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-fuchsia-300/35 bg-[#3b1d4a]/60 px-3 py-1.5 backdrop-blur-md"
          style={{ top: "max(12px, env(safe-area-inset-top))" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-medium text-white/80">Safety filter on</span>
        </div>
      )}

      {callStatus === "joined" && (
        <RemoteProfileAvatar
          photo={remotePreview.heroPhoto}
          name={remotePreview.name}
          onOpen={openProfile}
        />
      )}
      {callStatus === "joined" && (
        <button
          type="button"
          onClick={() => {
            setShowReport(true);
            setShowGiftPicker(false);
            setShowChatInput(false);
          }}
          className="absolute z-20 flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-300/40 bg-[#3b1d4a]/70 text-white backdrop-blur-md"
          style={{ top: "max(12px, env(safe-area-inset-top))", right: 16 }}
          aria-label="Report this person"
          data-testid="report-user-btn"
        >
          <ShieldAlert size={18} />
        </button>
      )}

      <div className="yn-call-dock">
        <div className="yn-call-bar" role="toolbar" aria-label="Call controls">
          {callStatus === "joined" && (
            <>
              <button
                type="button"
                onClick={toggleCam}
                className={`yn-call-btn ${camOn ? "" : "is-off"}`}
                data-testid="toggle-cam-btn"
                aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                aria-pressed={!camOn}
              >
                <span className="yn-call-btn-ring">
                  <CallIcon name={camOn ? "cam" : "camOff"} tone="plain" />
                </span>
                <span className="yn-call-btn-label">Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showChatInput) setShowChatInput(false);
                  else if (chatHistory.length > 0 && !displayedMessage) setShowHistory((v) => !v);
                  else { setShowChatInput(true); setShowHistory(false); setShowGiftPicker(false); }
                }}
                className="yn-call-btn"
                data-testid="chat-btn"
                aria-label="Open chat"
              >
                <span className="yn-call-btn-ring">
                  <CallIcon name="chat" tone="plain" />
                  {chatHistory.length > 0 && !displayedMessage && (
                    <span className="yn-call-btn-badge">{chatHistory.length > 9 ? "9+" : chatHistory.length}</span>
                  )}
                </span>
                <span className="yn-call-btn-label">Chat</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowGiftPicker((v) => !v); setShowChatInput(false); setShowHistory(false); }}
                className={`yn-call-btn${showGiftPicker ? " is-gift-open" : ""}`}
                data-testid="gift-btn"
                aria-label="Send gift"
                aria-pressed={showGiftPicker}
              >
                <span className="yn-call-btn-ring">
                  <CallIcon name="gift" tone="plain" />
                </span>
                <span className="yn-call-btn-label">Gifts</span>
              </button>
            </>
          )}

          {matchMode !== "direct" && (
            <button
              type="button"
              onClick={skipToNext}
              disabled={skipRemaining > 0}
              className={`yn-call-btn ${skipRemaining > 0 ? "is-disabled" : ""}`}
              data-testid="skip-btn"
              aria-label={skipRemaining > 0 ? `Skip to next person in ${skipRemaining} seconds` : "Skip to next person"}
            >
              <span className="yn-call-btn-ring">
                {skipRemaining > 0 ? (
                  <span className="yn-call-btn-count">{skipRemaining}</span>
                ) : (
                  <CallIcon name="skip" tone="plain" />
                )}
              </span>
              <span className="yn-call-btn-label">Skip</span>
            </button>
          )}

          {callStatus === "joined" && (
            <button
              type="button"
              onClick={handleEnd}
              className="yn-call-btn is-end"
              data-testid="end-call-btn"
              aria-label="End call"
            >
              <span className="yn-call-btn-ring">
                <CallIcon name="end" tone="plain" />
              </span>
              <span className="yn-call-btn-label">End Call</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoCallScreen;
export { VideoCallScreen };
