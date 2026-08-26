"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, Globe, MapPin, MessageCircle, MoreHorizontal, Plus, Share, Sparkles, Star, User, X } from "lucide-react";
import { CallReportSheet } from "@/components/call-report-sheet";
import { GiftArt } from "@/components/icons/gift-art";
import { InterestIcon } from "@/components/icons/interest-icons";
import { NeonAvatar, isPhotoSrc, neonInitial } from "@/components/neon-avatar";
import { CountryFlag } from "@/components/country-flag";
import { countryLabel, countryToIso } from "@/lib/countries";
import { incrementGiftsReceived, subscribeToUserProfile, type UserProfile } from "@/lib/firestore-service";
import { subscribeToOnlineMap, type FollowSnapshot } from "@/lib/follow-service";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { recordProfileView } from "@/lib/profile-views";
import {
  canonicalLanguage,
  reactionCount,
  REACTION_TO_GIFT,
  REACTION_TYPES,
  totalReactions,
  type ReactionId,
} from "@/lib/profile-catalog";
import { playGiftSound } from "@/lib/gift-sounds";
import { badgeFromUserDoc, submitUserReport, type ReportReasonId } from "@/lib/safety";
import { blockUserForMe } from "@/lib/user-settings";

const NEON_ID_RE = /^YN-[A-Z0-9]{4}(?:-[A-Z0-9]{4})+$/i;

function sanitizeDisplayName(name: string): string {
  const t = name.trim();
  if (!t || t === "—" || t === "-" || t === "–") return "";
  if (NEON_ID_RE.test(t)) return "";
  return t;
}

function formatLocationLine(countryName: string, location: string): string {
  const country = countryName.trim();
  const loc = location.trim();
  if (!loc && !country) return "";
  if (!loc) return country;
  if (!country) return loc;
  if (loc.toLowerCase() === country.toLowerCase()) return country;
  if (loc.toLowerCase().includes(country.toLowerCase())) return loc;
  return `${loc}, ${country}`;
}

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

function YouNeonBadgeMark() {
  return (
    <span className="yn-preview-badge" title="YouNeon Badge" aria-label="YouNeon Badge">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
  const name = sanitizeDisplayName(
    (firestoreUser?.fullName && firestoreUser.fullName.trim()) ||
      (hint?.name && hint.name.trim()) ||
      (dailyName && dailyName.trim()) ||
      (firestoreUser?.piUsername && firestoreUser.piUsername.trim()) ||
      ""
  );
  const ageRaw = firestoreUser?.age || hint?.age;
  const age = typeof ageRaw === "number" && ageRaw > 0 ? ageRaw : undefined;
  const countryRaw =
    (firestoreUser?.country && firestoreUser.country.trim()) ||
    (hint?.country && hint.country.trim()) ||
    "";
  const locationRaw =
    (firestoreUser?.location && firestoreUser.location.trim()) ||
    (hint?.country && hint.country.trim()) ||
    countryRaw;
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
    name,
    age,
    location: locationRaw,
    countryFlag: countryToIso(countryRaw) || countryToIso(locationRaw) || countryToIso(hint?.countryFlag) || "",
    countryName: countryLabel(countryRaw) || countryLabel(locationRaw) || countryLabel(hint?.countryFlag) || countryRaw || locationRaw,
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
      aria-label={`View ${name ? `${name}'s` : "their"} profile`}
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
  standalone: _standalone = false,
  onMessage,
  onReport,
  onBlock,
  onEdit,
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
  onEdit?: () => void;
}) {
  const [live, setLive] = useState<UserProfile | null>(null);
  const [online, setOnline] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [sendingRx, setSendingRx] = useState<string | null>(null);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);

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

  const gallery = profile.photos;
  const current = gallery[Math.min(activePhoto, Math.max(0, gallery.length - 1))] || "";
  const reactionTotal = totalReactions(profile.reactions);
  const displayName = profile.name || "this person";

  useEffect(() => {
    setActivePhoto(0);
    setShowReport(false);
    setShowMore(false);
    setSendingRx(null);
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
    if (!open) return;
    const html = document.documentElement;
    html.classList.add("yn-profile-open");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      html.classList.remove("yn-profile-open");
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const cyclePhoto = useCallback(
    (dir: number) => {
      if (gallery.length < 2) return;
      setActivePhoto((i) => (i + dir + gallery.length) % gallery.length);
    },
    [gallery.length]
  );

  const handleShare = async () => {
    const title = "YouNeon";
    const text = profile.name ? `Meet ${profile.name} on YouNeon` : "Meet someone on YouNeon";
    try {
      const piShare = window.Pi?.openShareDialog;
      if (typeof piShare === "function") {
        piShare(title, text);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore cancel */
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
    if (resolvedId && onMessage) {
      onMessage({
        id: resolvedId,
        name: profile.name || resolvedId,
        avatar: profile.name,
        photo: profile.heroPhoto,
        country: profile.location,
        countryFlag: profile.countryFlag,
        isOnline: online,
      });
    }
    onClose();
  };

  const handleReactionTap = (id: ReactionId) => {
    if (self || !viewerId || !resolvedId || sendingRx) return;
    const giftId = REACTION_TO_GIFT[id];
    if (!giftId) return;
    setSendingRx(id);
    playGiftSound(giftId);
    void incrementGiftsReceived(resolvedId, {
      fromId: viewerId,
      fromName: viewerId,
      giftId,
    }).finally(() => setSendingRx(null));
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

  if (!open || typeof document === "undefined") return null;

  const following = !!(resolvedId && followingIds.has(resolvedId));
  const locationText = formatLocationLine(profile.countryName || "", profile.location || "");
  const locationFlag = profile.countryFlag || profile.countryName || profile.location;
  const bioText = profile.bio.trim();

  const reactionGlyph = (id: ReactionId) => {
    const giftId = REACTION_TO_GIFT[id];
    if (giftId) {
      return <GiftArt id={giftId} size={32} variant="pick" instance={`profile-rx-${id}`} />;
    }
    return null;
  };

  const overlay = (
    <div
      className="yn-preview-overlay yn-preview-overlay--fullscreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yn-preview-name"
      data-testid="profile-preview-sheet"
    >
      <div className="yn-preview-sheet">
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
              if (Math.abs(dx) <= 40 || Math.abs(dx) < Math.abs(dy)) return;
              if (dx < 0) cyclePhoto(1);
              else cyclePhoto(-1);
            }}
            onClick={() => {
              if (gallery.length > 1) cyclePhoto(1);
            }}
          >
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
              <X size={22} strokeWidth={2.4} />
            </button>
            <div className="yn-preview-photo-tools">
              <button
                type="button"
                className="yn-preview-share"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleShare();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Share profile"
              >
                <Share size={18} strokeWidth={2.2} />
              </button>
              {!self ? (
                <div className="yn-preview-more-wrap">
                  <button
                    type="button"
                    className="yn-preview-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMore((v) => !v);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="More profile actions"
                    data-testid="profile-preview-more"
                  >
                    <MoreHorizontal size={20} strokeWidth={2.2} />
                  </button>
                  {showMore ? (
                    <div className="yn-preview-more-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMore(false);
                          if (onReport) onReport();
                          else setShowReport(true);
                        }}
                      >
                        Report
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        disabled={blocking}
                        onClick={() => {
                          setShowMore(false);
                          void handleBlockClick();
                        }}
                      >
                        <Ban size={14} />
                        Block
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
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
              <span className="yn-preview-online">
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
              <span className="yn-preview-name-cluster">
                {profile.name ? <span className="yn-preview-name-text">{profile.name}</span> : null}
                {profile.age ? (
                  <span className="yn-preview-age">
                    {profile.name ? ", " : ""}
                    {profile.age}
                  </span>
                ) : null}
              </span>
              {locationFlag ? <CountryFlag country={locationFlag} size={26} className="yn-preview-flag" /> : null}
              {profile.youneonBadge ? <YouNeonBadgeMark /> : null}
            </h2>

            {locationText ? (
              <p className="yn-preview-row yn-preview-location">
                <MapPin size={16} strokeWidth={2.2} />
                {locationText}
              </p>
            ) : null}

            {self ? (
              <div className="yn-preview-cta">
                <button
                  type="button"
                  onClick={() => {
                    if (onEdit) onEdit();
                    else onClose();
                  }}
                  className="yn-preview-btn is-primary is-edit"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="yn-preview-cta">
                <button
                  type="button"
                  disabled={!viewerId || !resolvedId || busyId === resolvedId}
                  onClick={handleFollow}
                  className={`yn-preview-btn ${following ? "is-ghost" : "is-primary"}`}
                >
                  {following ? null : <Plus size={18} strokeWidth={2.6} />}
                  {following ? "Following" : "Follow"}
                </button>
                <button type="button" onClick={handleMessage} className="yn-preview-btn is-message">
                  <MessageCircle size={18} strokeWidth={2.2} />
                  Message
                </button>
              </div>
            )}

            {bioText ? (
              <section className="yn-preview-section">
                <h3>
                  <User size={16} strokeWidth={2.2} />
                  About me
                </h3>
                <div className="yn-preview-about">{bioText}</div>
              </section>
            ) : null}

            {profile.interests.length > 0 ? (
              <section className="yn-preview-section">
                <h3>
                  <Star size={16} strokeWidth={2.2} />
                  Interests
                </h3>
                <div className="yn-preview-tags is-pills">
                  {profile.interests.map((tag) => (
                    <span key={tag} className="yn-preview-tag is-interest">
                      <InterestIcon tag={tag} size={18} />
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {profile.languages.length > 0 ? (
              <section className="yn-preview-section">
                <h3>
                  <Globe size={16} strokeWidth={2.2} />
                  Languages
                </h3>
                <div className="yn-preview-tags">
                  {profile.languages.map((lang) => (
                    <span key={lang} className="yn-preview-tag is-lang">
                      {canonicalLanguage(lang) || lang}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="yn-preview-section">
              <h3>
                <Sparkles size={16} strokeWidth={2.2} />
                Reactions
              </h3>
              <div className="yn-preview-rx-row" aria-label={`${reactionTotal} reactions received`}>
                {REACTION_TYPES.map((r) => {
                  const count = reactionCount(profile.reactions, r.id);
                  const glyph = reactionGlyph(r.id);
                  const tap = !self;
                  return tap ? (
                    <button
                      key={r.id}
                      type="button"
                      className="yn-preview-rx"
                      title={r.id}
                      disabled={!!sendingRx}
                      aria-label={`Send ${r.id}, ${count} received`}
                      onClick={() => handleReactionTap(r.id)}
                    >
                      {glyph}
                      <span className="tabular-nums">{count}</span>
                    </button>
                  ) : (
                    <div key={r.id} className="yn-preview-rx" title={r.id}>
                      {glyph}
                      <span className="tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {showReport ? (
        <div className="yn-preview-report" onClick={(e) => e.stopPropagation()}>
          <CallReportSheet
            userName={displayName}
            submitting={reporting}
            onClose={() => setShowReport(false)}
            onSubmit={(payload) => void handleReportSubmit(payload)}
          />
        </div>
      ) : null}
    </div>
  );

  return createPortal(overlay, document.body);
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
  onEdit,
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
  onEdit?: () => void;
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
      onEdit={onEdit}
    />
  );
}
