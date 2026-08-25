"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Ban, Check, Copy, Languages, MessageCircle, ShieldAlert, UserPlus, X } from "lucide-react";
import { CallReportSheet } from "@/components/call-report-sheet";
import { InterestIcon } from "@/components/icons/interest-icons";
import { ReactionIcon, ReactionsEarnedIcon } from "@/components/icons/reaction-icons";
import { NeonAvatar, isPhotoSrc, neonInitial } from "@/components/neon-avatar";
import { CountryLabel } from "@/components/country-flag";
import { countryLabel, countryToIso } from "@/lib/countries";
import { subscribeToUserProfile, type UserProfile } from "@/lib/firestore-service";
import { subscribeToOnlineMap, type FollowSnapshot } from "@/lib/follow-service";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { recordProfileView } from "@/lib/profile-views";
import {
  languageLabel,
  reactionCount,
  REACTION_TYPES,
  totalReactions,
} from "@/lib/profile-catalog";
import { badgeFromUserDoc, submitUserReport, type ReportReasonId } from "@/lib/safety";
import { blockUserForMe, ensureNeonId } from "@/lib/user-settings";

export type CallPartnerHint = {
  userId?: string;
  name?: string;
  avatar?: string;
  age?: number;
  country?: string;
  countryFlag?: string;
  bio?: string;
  interests?: string[];
  gender?: string;
};

export type ProfileChatTarget = {
  id: string;
  name: string;
  avatar: string;
  photo?: string;
  countryFlag?: string;
  country?: string;
  isOnline?: boolean;
};

function initialsFrom(name: string): string {
  return neonInitial(name);
}

function displayOrDash(value?: string | number | null): string {
  if (value === 0) return "—";
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "—";
}

function collectPhotos(firestoreUser: UserProfile | null, hint: CallPartnerHint | null): string[] {
  const out: string[] = [];
  const add = (src?: string) => {
    if (!isPhotoSrc(src)) return;
    const v = src!.trim();
    if (!out.includes(v)) out.push(v);
  };
  add(firestoreUser?.profilePicture);
  if (Array.isArray(firestoreUser?.photos)) {
    firestoreUser!.photos!.forEach(add);
  }
  add(hint?.avatar);
  return out;
}

function genderLabel(raw?: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (v === "man" || v === "male") return "Male";
  if (v === "woman" || v === "female") return "Female";
  if (v === "prefer not to say" || v === "hidden") return "Prefer not to say";
  return raw.trim();
}

function genderMark(label: string): string {
  if (label === "Male") return "♂";
  if (label === "Female") return "♀";
  return "⚥";
}

function YouNeonBadgeMark() {
  return (
    <span className="yn-preview-badge" title="YouNeon Badge" aria-label="YouNeon Badge">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 2.4 4.6 5.6v6.2c0 4.7 3.1 8.9 7.4 9.8 4.3-.9 7.4-5.1 7.4-9.8V5.6L12 2.4z"
          fill="url(#yn-badge-fill)"
        />
        <path
          d="M9.2 12.1 11 14l3.8-4.2"
          fill="none"
          stroke="#fff"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="yn-badge-fill" x1="4" y1="3" x2="20" y2="21">
            <stop stopColor="#c084fc" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export function mergeRemoteProfile(
  firestoreUser: UserProfile | null,
  hint: CallPartnerHint | null,
  dailyName?: string
) {
  const photos = collectPhotos(firestoreUser, hint);
  const name =
    (firestoreUser?.fullName && firestoreUser.fullName.trim()) ||
    (hint?.name && hint.name.trim()) ||
    (dailyName && dailyName.trim()) ||
    "";
  const ageRaw = firestoreUser?.age || hint?.age;
  const age = typeof ageRaw === "number" && ageRaw > 0 ? ageRaw : undefined;
  const location =
    (firestoreUser?.country && firestoreUser.country.trim()) ||
    (firestoreUser?.location && firestoreUser.location.trim()) ||
    (hint?.country && hint.country.trim()) ||
    "";
  const bio =
    (firestoreUser?.bio && firestoreUser.bio.trim()) ||
    (hint?.bio && hint.bio.trim()) ||
    "";
  const gifts =
    typeof firestoreUser?.giftsReceivedCount === "number" && firestoreUser.giftsReceivedCount >= 0
      ? firestoreUser.giftsReceivedCount
      : 0;
  const hideGender = !!(firestoreUser as UserProfile | null)?.hideGender;
  const genderRaw = hideGender ? undefined : firestoreUser?.gender || hint?.gender;

  return {
    name: name || "—",
    age,
    location,
    countryFlag: countryToIso(location) || countryToIso(hint?.countryFlag) || "",
    countryName: countryLabel(location) || countryLabel(hint?.countryFlag) || location,
    bio,
    photos,
    heroPhoto: photos[0] || "",
    giftsReceived: gifts,
    initials: initialsFrom(name || ""),
    interests: firestoreUser?.interests?.length ? firestoreUser.interests : hint?.interests || [],
    languages: Array.isArray(firestoreUser?.languages) ? firestoreUser!.languages.filter(Boolean) : [],
    youneonBadge: badgeFromUserDoc(firestoreUser as unknown as Record<string, unknown>),
    hideGender,
    gender: genderLabel(genderRaw),
    neonId: (firestoreUser?.neonId || "").trim(),
    reactions: firestoreUser?.reactionsReceived,
    userId: firestoreUser?.id || firestoreUser?.uid || firestoreUser?.piUsername || hint?.userId || "",
  };
}

export function RemoteProfileAvatar({
  photo,
  name,
  initials,
  onOpen,
}: {
  photo?: string;
  name: string;
  initials: string;
  onOpen: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = isPhotoSrc(photo) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [photo]);

  return (
    <button
      type="button"
      className="yn-remote-avatar"
      onClick={onOpen}
      data-testid="remote-profile-avatar"
      aria-label={`View ${name === "—" ? "their" : `${name}'s`} profile`}
    >
      {showPhoto ? (
        <img src={photo} alt="" onError={() => setImgFailed(true)} />
      ) : (
        <span className="yn-remote-avatar-fallback">{initials}</span>
      )}
    </button>
  );
}

export function ProfilePreviewSheet({
  open,
  onClose,
  userId,
  viewerId,
  seed,
  hint,
  dailyName,
  isSelf,
  standalone = false,
  onMessage,
  onReport,
  onBlock,
}: {
  open: boolean;
  onClose: () => void;
  userId?: string;
  viewerId?: string;
  seed?: UserProfile | null;
  hint?: CallPartnerHint | null;
  dailyName?: string;
  isSelf?: boolean;
  standalone?: boolean;
  onMessage?: (user: ProfileChatTarget) => void;
  onReport?: () => void;
  onBlock?: () => void;
}) {
  const [live, setLive] = useState<UserProfile | null>(null);
  const [online, setOnline] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [copied, setCopied] = useState(false);
  const [ensuredId, setEnsuredId] = useState("");
  const [reporting, setReporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const dragRef = useRef<{ startY: number; dy: number } | null>(null);

  const resolvedId = (userId || hint?.userId || seed?.id || seed?.uid || seed?.piUsername || "").trim();
  const self = isSelf ?? (!!viewerId && !!resolvedId && viewerId === resolvedId);

  const followMe: FollowSnapshot = { id: viewerId || "" };
  const { followingIds, busyId, toggleFollow } = useFollowGraph(viewerId);

  useEffect(() => {
    if (!open || !resolvedId) {
      setLive(null);
      return;
    }
    return subscribeToUserProfile(resolvedId, setLive);
  }, [open, resolvedId]);

  useEffect(() => {
    if (!open || !resolvedId) {
      setOnline(false);
      return;
    }
    return subscribeToOnlineMap([resolvedId], (map) => setOnline(!!map[resolvedId]));
  }, [open, resolvedId]);

  useEffect(() => {
    if (!open) return;
    if (!viewerId || !resolvedId || self) return;
    void recordProfileView({ viewerId, viewedUserId: resolvedId });
  }, [open, viewerId, resolvedId, self]);

  const mergedUser = useMemo(() => {
    if (!seed && !live) return live;
    const compact: Record<string, unknown> = {};
    if (seed) {
      for (const [k, v] of Object.entries(seed)) {
        if (v !== undefined && v !== null) compact[k] = v;
      }
    }
    return { ...(live || {}), ...compact } as UserProfile;
  }, [live, seed]);

  const profile = useMemo(
    () => mergeRemoteProfile(mergedUser, hint || null, dailyName),
    [mergedUser, hint, dailyName]
  );

  const neonId = (profile.neonId || (self ? ensuredId : "")).trim();

  useEffect(() => {
    if (!open || !self || !resolvedId) return;
    if (profile.neonId) {
      setEnsuredId(profile.neonId);
      return;
    }
    let cancelled = false;
    void ensureNeonId(resolvedId, profile.neonId).then((id) => {
      if (!cancelled) setEnsuredId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [open, self, resolvedId, profile.neonId]);

  const gallery = profile.photos;
  const current = gallery[Math.min(activePhoto, Math.max(0, gallery.length - 1))] || "";
  const reactionTotal = totalReactions(profile.reactions);

  useEffect(() => {
    setActivePhoto(0);
    setCopied(false);
    setShowReport(false);
  }, [profile.heroPhoto, open, resolvedId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setDragging(false);
      dragRef.current = null;
    }
  }, [open]);

  const beginSheetDrag = (clientY: number) => {
    dragRef.current = { startY: clientY, dy: 0 };
    setDragging(true);
  };

  const moveSheetDrag = (clientY: number) => {
    if (!dragRef.current) return;
    const dy = Math.max(0, clientY - dragRef.current.startY);
    dragRef.current.dy = dy;
    setDragY(dy);
  };

  const endSheetDrag = () => {
    const dy = dragRef.current?.dy ?? 0;
    dragRef.current = null;
    setDragging(false);
    if (dy > 88) {
      setDragY(0);
      onClose();
      return;
    }
    setDragY(0);
  };

  const onHandlePointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    beginSheetDrag(e.clientY);
  };

  const onHandlePointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    moveSheetDrag(e.clientY);
  };

  const onHandlePointerUp = () => {
    endSheetDrag();
  };

  const cyclePhoto = useCallback(
    (dir: number) => {
      if (gallery.length < 2) return;
      setActivePhoto((i) => (i + dir + gallery.length) % gallery.length);
    },
    [gallery.length]
  );

  const copyCode = async () => {
    if (!neonId) return;
    try {
      await navigator.clipboard.writeText(neonId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const handleFollow = () => {
    if (!viewerId || !resolvedId || self) return;
    void toggleFollow(followMe, {
      id: resolvedId,
      name: profile.name,
      photo: profile.heroPhoto,
      country: profile.location,
      age: profile.age,
    });
  };

  const handleMessage = () => {
    if (!resolvedId || !onMessage) return;
    onMessage({
      id: resolvedId,
      name: profile.name === "—" ? resolvedId : profile.name,
      avatar: profile.name,
      photo: profile.heroPhoto,
      country: profile.location,
      countryFlag: profile.countryFlag,
      isOnline: online,
    });
    onClose();
  };

  const handleBlockClick = async () => {
    if (onBlock) {
      onBlock();
      return;
    }
    if (!viewerId || !resolvedId || self) return;
    setBlocking(true);
    try {
      await blockUserForMe(viewerId, {
        id: resolvedId,
        name: profile.name,
        photo: profile.heroPhoto,
      });
    } catch {
      /* ignore */
    }
    setBlocking(false);
    onClose();
  };

  const handleReportSubmit = async (input: {
    reasonId: ReportReasonId;
    reasonLabel: string;
    notes: string;
    alsoBlock: boolean;
  }) => {
    if (!viewerId || !resolvedId) return;
    setReporting(true);
    try {
      await submitUserReport({
        reporterId: viewerId,
        reportedUserId: resolvedId,
        reportedName: profile.name,
        reasonId: input.reasonId,
        reasonLabel: input.reasonLabel,
        notes: input.notes,
      });
      if (input.alsoBlock) {
        await blockUserForMe(viewerId, {
          id: resolvedId,
          name: profile.name,
          photo: profile.heroPhoto,
        });
      }
    } catch (e) {
      console.warn("Report failed", e);
    }
    setReporting(false);
    setShowReport(false);
    onClose();
  };

  if (!open) return null;

  const following = !!(resolvedId && followingIds.has(resolvedId));
  const countryLine = profile.countryFlag || profile.countryName || profile.location ? (
    <CountryLabel
      country={profile.countryFlag || profile.countryName || profile.location}
      name={profile.countryName || profile.location}
      size={18}
    />
  ) : (
    <span>—</span>
  );

  return (
    <div
      className={`yn-preview-overlay${standalone ? " yn-preview-overlay--standalone" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yn-preview-name"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="profile-preview-sheet"
    >
      <div
        className="yn-preview-drag"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.22s ease",
        }}
      >
      <div className="yn-preview-sheet" onClick={(e) => e.stopPropagation()}>
        <div
          className="yn-preview-handle-hit"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="yn-preview-handle" aria-hidden="true" />
        </div>
        <button
          type="button"
          className="yn-preview-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close profile"
          data-testid="profile-preview-close"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
        <div className="yn-preview-scroll">
          <div
            className="yn-preview-photo"
            onTouchStart={(e) => {
              const t = e.changedTouches[0];
              touchX.current = t?.clientX ?? null;
              touchY.current = t?.clientY ?? null;
            }}
            onTouchEnd={(e) => {
              const startX = touchX.current;
              const startY = touchY.current;
              touchX.current = null;
              touchY.current = null;
              if (startX == null || startY == null) return;
              const t = e.changedTouches[0];
              const dx = (t?.clientX ?? startX) - startX;
              const dy = (t?.clientY ?? startY) - startY;
              if (dy > 72 && dy > Math.abs(dx) * 1.15) {
                onClose();
                return;
              }
              if (Math.abs(dx) <= 40 || Math.abs(dx) < Math.abs(dy)) return;
              if (dx < 0) cyclePhoto(1);
              else cyclePhoto(-1);
            }}
            onClick={() => {
              if (gallery.length > 1) cyclePhoto(1);
            }}
          >
            {gallery.length > 1 ? (
              <div className="yn-preview-segments" aria-hidden="true">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`yn-preview-segment ${i === activePhoto ? "is-on" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhoto(i);
                    }}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            ) : null}
            {online ? (
              <span className={`yn-preview-online${gallery.length > 1 ? "" : " is-solo"}`}>
                <span className="yn-preview-online-dot" />
                Online
              </span>
            ) : null}
            {isPhotoSrc(current) ? (
              <img src={current} alt="" />
            ) : (
              <div className="yn-preview-photo-fallback">
                <NeonAvatar src="" name={profile.name} size={96} showPhoto={false} />
              </div>
            )}
          </div>

          <div className="yn-preview-body">
            <h2 id="yn-preview-name" className="yn-preview-name">
              <span>
                {profile.name}
                {profile.age ? <span className="yn-preview-age">, {profile.age}</span> : null}
              </span>
              {profile.youneonBadge ? <YouNeonBadgeMark /> : null}
            </h2>

            <p className="yn-preview-row">{countryLine}</p>

            {!profile.hideGender && profile.gender ? (
              <p className="yn-preview-row">
                <span className="yn-preview-gender-mark">{genderMark(profile.gender)}</span>
                {profile.gender}
              </p>
            ) : null}

            <p className="yn-preview-row yn-preview-code">
              <span className="yn-preview-id-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="8.5" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M12.5 10.5h6M12.5 13.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-white/45">Code</span>
              <span className="yn-preview-code-value">{neonId || "—"}</span>
              {neonId ? (
                <button
                  type="button"
                  className="yn-preview-copy"
                  onClick={() => void copyCode()}
                  aria-label="Copy Neon ID"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              ) : null}
            </p>

            {profile.interests.length > 0 ? (
              <section className="yn-preview-section">
                <h3>Interests</h3>
                <div className="yn-preview-tags">
                  {profile.interests.map((tag) => (
                    <span key={tag} className="yn-preview-tag">
                      <InterestIcon tag={tag} size={15} />
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {profile.languages.length > 0 ? (
              <section className="yn-preview-section">
                <h3>Languages</h3>
                <div className="yn-preview-tags">
                  {profile.languages.map((lang) => (
                    <span key={lang} className="yn-preview-tag">
                      <Languages size={13} className="text-white/45" />
                      {languageLabel(lang)}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="yn-preview-section">
              <h3>About me</h3>
              <div className="yn-preview-about">{displayOrDash(profile.bio)}</div>
            </section>

            <section className="yn-preview-section">
              <h3>Reactions Received</h3>
              <div className="yn-preview-reactions">
                <p className="yn-preview-reactions-sum">
                  <span className="yn-preview-smile" aria-hidden="true">
                    <ReactionsEarnedIcon size={16} />
                  </span>
                  {reactionTotal} video chat reactions earned!
                </p>
                <ul>
                  {REACTION_TYPES.map((r) => (
                    <li key={r.id}>
                      <span>
                        <ReactionIcon id={r.id} size={20} />
                        {r.id}
                      </span>
                      <span className="tabular-nums">{reactionCount(profile.reactions, r.id)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>

        {!self ? (
          <div className="yn-preview-actions">
            <div className="yn-preview-actions-row">
              <button
                type="button"
                disabled={!viewerId || !resolvedId || busyId === resolvedId}
                onClick={handleFollow}
                className={`yn-preview-btn ${following ? "is-ghost" : "is-primary"}`}
              >
                <UserPlus size={15} />
                {following ? "Following" : "Follow"}
              </button>
              {onMessage ? (
                <button type="button" onClick={handleMessage} className="yn-preview-btn is-message">
                  <MessageCircle size={15} />
                  Message
                </button>
              ) : null}
            </div>
            <div className="yn-preview-actions-row">
              <button
                type="button"
                className="yn-preview-btn is-ghost"
                onClick={() => {
                  if (onReport) onReport();
                  else setShowReport(true);
                }}
              >
                <ShieldAlert size={15} />
                Report
              </button>
              <button
                type="button"
                className="yn-preview-btn is-danger"
                disabled={blocking}
                onClick={() => void handleBlockClick()}
              >
                <Ban size={15} />
                Block
              </button>
            </div>
          </div>
        ) : null}
      </div>
      </div>

      {showReport ? (
        <div className="yn-preview-report" onClick={(e) => e.stopPropagation()}>
          <CallReportSheet
            userName={profile.name === "—" ? "this person" : profile.name}
            submitting={reporting}
            onClose={() => setShowReport(false)}
            onSubmit={(payload) => void handleReportSubmit(payload)}
          />
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use ProfilePreviewSheet — same UI. */
export function RemoteProfileModal({
  open,
  onClose,
  firestoreUser,
  hint,
  dailyName,
  viewerId,
  standalone = false,
  onReport,
  onBlock,
  onMessage,
  isSelf,
}: {
  open: boolean;
  onClose: () => void;
  firestoreUser: UserProfile | null;
  hint: CallPartnerHint | null;
  dailyName?: string;
  viewerId?: string;
  standalone?: boolean;
  onReport?: () => void;
  onBlock?: () => void;
  onMessage?: (user: ProfileChatTarget) => void;
  isSelf?: boolean;
}) {
  return (
    <ProfilePreviewSheet
      open={open}
      onClose={onClose}
      userId={firestoreUser?.id || firestoreUser?.uid || firestoreUser?.piUsername || hint?.userId}
      viewerId={viewerId}
      seed={firestoreUser}
      hint={hint}
      dailyName={dailyName}
      isSelf={isSelf}
      standalone={standalone}
      onMessage={onMessage}
      onReport={onReport}
      onBlock={onBlock}
    />
  );
}
