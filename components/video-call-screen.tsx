"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
import {
  dailyRoomIdFromUrl,
  submitUserReport,
  type ReportReasonId,
} from "@/lib/safety";

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
}

type PermissionState = "checking" | "granted" | "denied" | "not-found" | "in-use" | "error";
type CallStatus = "idle" | "preview" | "joining" | "waiting" | "joined";

interface ChatMsg { id: string; from: "me" | "partner"; text: string; timestamp: number; }

const SKIP_COOLDOWN_MS = 5000;

const NSFW_PORN_THRESHOLD = 0.7;
const NSFW_HENTAI_THRESHOLD = 0.7;
const NSFW_SEXY_THRESHOLD = 0.85;
const NSFW_CHECK_INTERVAL_MS = 2000;

type CallIconName = "mic" | "micOff" | "cam" | "camOff" | "chat" | "gift" | "skip" | "end";

function CallIcon({ name, uid }: { name: CallIconName; uid?: string }) {
  const gid = `yn-stroke-${uid || name}`;
  const off = name === "micOff" || name === "camOff" || name === "end";
  const stroke = off ? "currentColor" : `url(#${gid})`;
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="3" y1="2" x2="21" y2="22">
          <stop stopColor="#c084fc" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
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
            <path d="M5.2 7.1 12.1 12 5.2 16.9z" />
            <path d="M12.4 7.1 19.3 12l-6.9 4.9z" />
          </>
        )}
        {name === "end" && (
          <>
            <path d="M7.1 14.6c3.3 2.4 6.5 2.4 9.8 0" strokeWidth="2.05" />
            <path d="M5.4 12.4 7.2 14.8M18.6 12.4 16.8 14.8" strokeWidth="2.05" />
          </>
        )}
      </g>
    </svg>
  );
}

function WaitingMatchPanel({
  title,
  subtitle,
  premium,
}: {
  title: string;
  subtitle: string;
  premium?: boolean;
}) {
  return (
    <div className="yn-wait-overlay">
      <div className="yn-wait-orb" aria-hidden="true">
        <span className="yn-wait-ring" />
        <span className="yn-wait-ring yn-wait-ring-delay" />
        <span className="yn-wait-core" />
      </div>
      <span className="yn-call-wordmark text-[1.65rem]">YouNeon</span>
      {premium && <p className="yn-wait-priority">Priority matching</p>}
      <p className="yn-wait-title">{title}</p>
      <p className="yn-wait-sub">{subtitle}</p>
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
}: VideoCallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const roomUrlRef = useRef("");
  const giftLogRef = useRef<Array<{ giftId: string; emoji?: string; direction: "sent" | "received"; timestamp: number }>>([]);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const nsfwModelRef = useRef<any>(null);
  const nsfwIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartedRef = useRef(Date.now());
  const hadRemoteRef = useRef(false);
  const partnerRef = useRef<PartnerProfile | null>(partnerProfile || (partnerName ? { name: partnerName } : null));
  const matchOptsRef = useRef({
    currentUserId,
    currentUserName,
    currentUserProfile,
    isPremium,
    matchMode,
    filters,
    roomKey,
    partnerProfile,
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
  };

  const [permission, setPermission] = useState<PermissionState>("checking");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [browser, setBrowser] = useState<"chrome" | "edge" | "firefox" | "other">("other");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const camOnRef = useRef(true);
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
  const bypassTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg/")) setBrowser("edge");
    else if (ua.includes("chrome")) setBrowser("chrome");
    else if (ua.includes("firefox")) setBrowser("firefox");
    else setBrowser("other");
  }, []);

  const checkPermissions = async () => {
    setPermission("checking");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
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
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });

    (async () => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js");
        const nsfwjs = (window as any).nsfwjs;
        if (!nsfwjs) throw new Error("nsfwjs not available on window");
        const model = await nsfwjs.load(
          "https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/models/mobilenet_v2/"
        );
        if (!cancelled) {
          nsfwModelRef.current = model;
          console.log("✅ NSFW AI model loaded from CDN");
        }
      } catch (e) {
        console.warn("⚠️ NSFW model failed to load:", e);
      }
    })();
    return () => { cancelled = true; };
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

  useEffect(() => {
    if (permission !== "granted" || callStatus !== "preview") return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        previewStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) { console.warn(e); }
    })();
    return () => {
      cancelled = true;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
    };
  }, [permission, callStatus]);

  useEffect(() => {
    if (callStatus !== "joined" || !nsfwModelRef.current || bypassNsfw) {
      if (nsfwIntervalRef.current) clearInterval(nsfwIntervalRef.current);
      return;
    }
    const checkFrame = async () => {
      const video = remoteVideoRef.current;
      const model = nsfwModelRef.current;
      if (!video || !model || video.readyState < 2 || video.videoWidth === 0) return;
      try {
        const predictions: Array<{ className: string; probability: number }> = await model.classify(video);
        let triggered: string | null = null;
        for (const p of predictions) {
          if (p.className === "Porn" && p.probability > NSFW_PORN_THRESHOLD) triggered = "nudity";
          else if (p.className === "Hentai" && p.probability > NSFW_HENTAI_THRESHOLD) triggered = "explicit drawing";
          else if (p.className === "Sexy" && p.probability > NSFW_SEXY_THRESHOLD) triggered = "suggestive content";
        }
        if (triggered) {
          setNsfwReason(triggered);
          setNsfwBlur(true);
        }
      } catch (e) { /* silent */ }
    };
    nsfwIntervalRef.current = setInterval(checkFrame, NSFW_CHECK_INTERVAL_MS);
    return () => { if (nsfwIntervalRef.current) clearInterval(nsfwIntervalRef.current); };
  }, [callStatus, bypassNsfw, sessionId]);

  const updateMediaElements = useCallback((call: DailyCall) => {
    const participants = call.participants();
    let remoteCount = 0;
    Object.values(participants).forEach((p: DailyParticipant) => {
      if (p.local) {
        const videoTrack = p.tracks.video?.persistentTrack;
        if (videoTrack && localVideoRef.current) {
          const cur = localVideoRef.current.srcObject as MediaStream | null;
          if (!cur || cur.getVideoTracks()[0] !== videoTrack) {
            localVideoRef.current.srcObject = new MediaStream([videoTrack]);
          }
        }
      } else {
        remoteCount++;
        setRemoteName(p.user_name || "Partner");
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
        const videoTrack = p.tracks.video?.persistentTrack;
        const audioTrack = p.tracks.audio?.persistentTrack;
        if (videoTrack && remoteVideoRef.current) {
          const cur = remoteVideoRef.current.srcObject as MediaStream | null;
          if (!cur || cur.getVideoTracks()[0] !== videoTrack) {
            remoteVideoRef.current.srcObject = new MediaStream([videoTrack]);
          }
        }
        if (audioTrack && remoteAudioRef.current) {
          const cur = remoteAudioRef.current.srcObject as MediaStream | null;
          if (!cur || cur.getAudioTracks()[0] !== audioTrack) {
            remoteAudioRef.current.srcObject = new MediaStream([audioTrack]);
          }
        }
      }
    });
    if (remoteCount > 0) {
      hadRemoteRef.current = true;
      setCallStatus("joined");
    } else {
      setCallStatus("waiting");
      if (hadRemoteRef.current && matchOptsRef.current.matchMode === "random") {
        hadRemoteRef.current = false;
        setPartner(null);
        const uid = matchOptsRef.current.currentUserId || "anon";
        requeueSameRoom(uid).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    let cancelled = false;
    let unsubMatch: (() => void) | undefined;
    const opts = matchOptsRef.current;
    const userId = opts.currentUserId || "anon";
    sessionStartedRef.current = Date.now();
    hadRemoteRef.current = false;

    const stopPreview = () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
    };

    const start = async () => {
      try {
        setCallStatus("preview");
        setSkipRemaining(SKIP_COOLDOWN_MS / 1000);
        setNsfwBlur(false);
        setBypassNsfw(false);
        setRemoteName("");
        setCamOn(true);
        setMicOn(true);
        giftLogRef.current = [];
        roomUrlRef.current = "";
        if (opts.matchMode === "direct" && opts.partnerProfile) setPartner(opts.partnerProfile);
        else if (opts.matchMode === "random") setPartner(opts.partnerProfile || null);

        let url = "";
        if (opts.matchMode === "direct") {
          setCallStatus("joining");
          const room = await createOrGetNamedRoom(opts.roomKey || `direct-${userId}`);
          url = room.url;
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

        stopPreview();
        setCallStatus("joining");
        const callObject = DailyIframe.createCallObject({ audioSource: true, videoSource: true });
        callRef.current = callObject;
        const refresh = () => updateMediaElements(callObject);
        callObject.on("joined-meeting", refresh);
        callObject.on("participant-joined", refresh);
        callObject.on("participant-updated", refresh);
        callObject.on("participant-left", refresh);
        callObject.on("track-started", refresh);
        callObject.on("track-stopped", refresh);
        callObject.on("app-message", (event: any) => {
          const d = event?.data;
          if (!d || !d.type) return;
          if (d.type === "chat" && d.text) {
            showIncomingMessage({
              id: `msg-${Date.now()}-${Math.random()}`,
              from: "partner", text: String(d.text).slice(0, 200), timestamp: Date.now(),
            });
          } else if (d.type === "gift") {
            const giftId = resolveGiftId(d.giftId, d.emoji);
            if (!giftId) return;
            triggerGiftBurst(giftId);
            const meta = CALL_GIFTS.find((g) => g.id === giftId);
            giftLogRef.current.push({
              giftId,
              emoji: meta?.emoji || String(d.emoji || ""),
              direction: "received",
              timestamp: Date.now(),
            });
            saveReceivedGift(giftId, meta?.emoji || String(d.emoji || ""), partnerRef.current?.name || "Partner");
          }
        });
        await callObject.join({
          url,
          userName: opts.currentUserName || "Me",
          userData: { userId },
        });
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
      if (opts.matchMode === "random") leaveMatchQueue(userId).catch(() => {});
      setDisplayedMessage(null); setChatHistory([]); setGiftBurst(null);
      setShowChatInput(false); setShowHistory(false); setShowGiftPicker(false);
      setShowProfile(false); setRemoteUserDoc(null); setRemoteName(""); setNsfwBlur(false); setBypassNsfw(false);
      if (bypassTimerRef.current) clearTimeout(bypassTimerRef.current);
      if (callRef.current) {
        callRef.current.leave().catch(() => {});
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
      stopPreview();
    };
  }, [permission, sessionId, updateMediaElements, showIncomingMessage, triggerGiftBurst, saveReceivedGift]);

  useEffect(() => {
    camOnRef.current = camOn;
  }, [camOn]);

  useEffect(() => {
    if (callStatus !== "joined" && callStatus !== "waiting") return;
    const onVis = () => {
      const call = callRef.current;
      if (!call || !readLocalBackgroundPlay()) return;
      if (document.hidden) call.setLocalVideo(false);
      else call.setLocalVideo(camOnRef.current);
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
    if (!callRef.current) return;
    const next = !camOn;
    callRef.current.setLocalVideo(next);
    setCamOn(next);
  };

  const toggleMic = () => {
    if (!callRef.current) return;
    const next = !micOn;
    callRef.current.setLocalAudio(next);
    setMicOn(next);
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
    if (matchMode === "random") await leaveMatchQueue(userId).catch(() => {});
    if (callRef.current) await callRef.current.leave().catch(() => {});
    onEnd({
      partner: partnerRef.current,
      durationSeconds: Math.max(0, Math.floor((Date.now() - sessionStartedRef.current) / 1000)),
    });
  };

  const handleSeeAnyway = () => {
    setNsfwBlur(false);
    setBypassNsfw(true);
    if (bypassTimerRef.current) clearTimeout(bypassTimerRef.current);
    bypassTimerRef.current = setTimeout(() => setBypassNsfw(false), 30000);
  };

  const leavePartner = () => {
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

  if (callStatus === "preview") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-yn-bg p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-16 h-72 w-72 rounded-full bg-fuchsia-200/45 blur-3xl" />
          <div className="absolute bottom-20 right-1/5 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
        </div>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="yn-call-pip object-cover scale-x-[-1]"
        />
        <WaitingMatchPanel
          title="Finding a match…"
          subtitle="Looking for someone in the same room…"
        />
        <button
          onClick={() => onEnd()}
          className="absolute right-4 top-[max(12px,env(safe-area-inset-top))] rounded-full border border-black/10 bg-yn-card px-4 py-2 text-sm font-medium text-yn-text shadow-sm backdrop-blur-md hover:bg-white"
          aria-label="Cancel matching"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1a0a24]">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
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
              <h2 className="text-xl font-semibold mb-2">Inappropriate content detected</h2>
              <p className="text-white/70 text-sm">
                Our AI detected possible <b className="text-red-300">{nsfwReason}</b> in the video.
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

      <div className="yn-call-pip">
        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" data-testid="local-video" />
        {!camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#1f1228]/90 text-xs text-white/80">
            <CallIcon name="camOff" uid="pip-cam" />
            <span>Camera off</span>
          </div>
        )}
        {!micOn && (
          <div className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-pink-400/40 bg-black/70 text-pink-200">
            <CallIcon name="micOff" uid="pip-mic" />
          </div>
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
        <div className="absolute left-1/2 z-40 w-[90%] max-w-md -translate-x-1/2" style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", animation: "yn-slide-up 0.25s ease forwards" }}>
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

      {callStatus === "waiting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none">
          <WaitingMatchPanel
            title="Waiting for match…"
            subtitle={isPremium ? "You are in the priority queue." : "Stay on this screen — the next person joins the same room."}
            premium={isPremium}
          />
        </div>
      )}
      {callStatus === "joining" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none">
          <WaitingMatchPanel title="Starting video…" subtitle="Connecting your camera and microphone." />
        </div>
      )}

      {callStatus === "joined" && nsfwModelRef.current && !nsfwBlur && (
        <div
          className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-fuchsia-300/35 bg-[#3b1d4a]/60 px-3 py-1.5 backdrop-blur-md"
          style={{ top: "max(12px, env(safe-area-inset-top))" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-medium text-white/80">AI protection on</span>
        </div>
      )}

      {callStatus === "joined" && (
        <RemoteProfileAvatar
          photo={remotePreview.heroPhoto}
          name={remotePreview.name}
          initials={remotePreview.initials}
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
          <button
            type="button"
            onClick={toggleMic}
            className={`yn-call-btn ${micOn ? "" : "is-off"}`}
            data-testid="toggle-mic-btn"
            aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            aria-pressed={!micOn}
          >
            <CallIcon name={micOn ? "mic" : "micOff"} />
          </button>

          <button
            type="button"
            onClick={toggleCam}
            className={`yn-call-btn ${camOn ? "" : "is-off"}`}
            data-testid="toggle-cam-btn"
            aria-label={camOn ? "Turn camera off" : "Turn camera on"}
            aria-pressed={!camOn}
          >
            <CallIcon name={camOn ? "cam" : "camOff"} />
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
            <CallIcon name="chat" />
            {chatHistory.length > 0 && !displayedMessage && (
              <span className="yn-call-btn-badge">{chatHistory.length > 9 ? "9+" : chatHistory.length}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setShowGiftPicker((v) => !v); setShowChatInput(false); setShowHistory(false); }}
            className="yn-call-btn is-gift"
            data-testid="gift-btn"
            aria-label="Send gift"
          >
            <CallIcon name="gift" />
          </button>

          {matchMode !== "direct" && (
            <button
              type="button"
              onClick={skipToNext}
              disabled={skipRemaining > 0}
              className={`yn-call-btn ${skipRemaining > 0 ? "is-disabled" : ""}`}
              data-testid="skip-btn"
              aria-label={skipRemaining > 0 ? `Skip to next person in ${skipRemaining} seconds` : "Skip to next person"}
            >
              {skipRemaining > 0 ? (
                <span className="yn-call-btn-count">{skipRemaining}</span>
              ) : (
                <CallIcon name="skip" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleEnd}
            className="yn-call-btn is-end"
            data-testid="end-call-btn"
            aria-label="End call"
          >
            <CallIcon name="end" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCallScreen;
export { VideoCallScreen };
