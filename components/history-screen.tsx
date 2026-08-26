"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, MessageCircle, PencilLine, SlidersHorizontal, Sparkles, Video } from "lucide-react";
import { ProfilePreviewSheet } from "@/components/call-remote-profile";
import { NeonAvatar } from "@/components/neon-avatar";
import { getUserProfile, subscribeToHistory, type UserProfile } from "@/lib/firestore-service";
import { subscribeToOnlineMap, type FollowSnapshot } from "@/lib/follow-service";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { useBlockedIds } from "@/hooks/use-user-settings";
import { CountryFlag } from "@/components/country-flag";
import { subscribeToProfileViews, type ProfileView } from "@/lib/profile-views";
import {
  displayDuration,
  durationSecondsFromHistory,
  formatHistoryWhen,
  genderBucket,
  toMillis,
  type GenderFilter,
} from "@/lib/history-utils";

interface HistoryScreenProps {
  currentUserId?: string;
  hasOwnPhoto?: boolean;
  currentUser?: FollowSnapshot;
  onOpenChat?: (user: {
    id: string;
    name: string;
    avatar: string;
    photo?: string;
    countryFlag?: string;
    country?: string;
    isOnline?: boolean;
  }) => void;
  onOpenProfile?: (userId: string) => void;
}

type HistoryTab = "recent" | "viewed";
type StatusFilter = "all" | "online";
type SortFilter = "recent" | "long";
type ActivityKind = "perfect" | "updated" | "chat";
type ActionTone = "outline" | "fill";

type HistoryRow = {
  id: string;
  matchId: string;
  name: string;
  avatar?: string;
  photo?: string;
  countryFlag?: string;
  country?: string;
  gender?: string;
  languages?: string[];
  duration?: string;
  durationSeconds?: number | null;
  timestamp?: unknown;
};

type LiveProfile = {
  photo: string;
  name: string;
  country: string;
  gender: string;
  languages: string[];
  lastProfileUpdateMs: number;
};

type AppliedFilter = {
  gender: GenderFilter;
  status: StatusFilter;
  sort: SortFilter;
};

const PROFILE_UPDATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const EMPTY_FILTER: AppliedFilter = { gender: "all", status: "all", sort: "recent" };

function timestampMs(value: unknown): number {
  return toMillis(value);
}

function mergeRow(row: HistoryRow, live?: LiveProfile): HistoryRow {
  if (!live) return row;
  return {
    ...row,
    name: live.name || row.name,
    photo: live.photo || row.photo || "",
    country: live.country || row.country || "",
    gender: live.gender || row.gender || "",
    languages: live.languages.length ? live.languages : row.languages || [],
  };
}

function pickPerfectMatches(rows: HistoryRow[]): HistoryRow[] {
  const best = new Map<string, HistoryRow>();
  rows.forEach((row) => {
    const key = row.matchId || row.id;
    if (!key) return;
    const prev = best.get(key);
    const dur = durationSecondsFromHistory(row) ?? -1;
    const prevDur = prev ? durationSecondsFromHistory(prev) ?? -1 : -1;
    const newer = timestampMs(row.timestamp) > timestampMs(prev?.timestamp);
    if (!prev || dur > prevDur || (dur === prevDur && newer)) best.set(key, row);
  });
  const unique = [...best.values()];
  const quality = unique.filter((r) => (durationSecondsFromHistory(r) ?? 0) >= 45);
  if (quality.length === 0) return [];
  return quality
    .sort((a, b) => (durationSecondsFromHistory(b) ?? 0) - (durationSecondsFromHistory(a) ?? 0))
    .slice(0, 6);
}

function filterLabel(filter: AppliedFilter): string {
  const parts: string[] = [];
  if (filter.gender === "female") parts.push("Female");
  else if (filter.gender === "male") parts.push("Male");
  if (filter.status === "online") parts.push("Online");
  if (filter.sort === "long") parts.push("Long chats");
  return parts.length ? parts.join(" · ") : "All";
}

function formatTimeAgo(ts: unknown): string {
  const ms = typeof ts === "number" && Number.isFinite(ts) ? ts : toMillis(ts);
  if (!ms) return "Just now";
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 45_000) return "Just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatHistoryWhen(ts);
}

function chatDescription(row: HistoryRow): string {
  const dur = displayDuration(row);
  if (dur && dur !== "—") return `Video chat · ${dur}`;
  return "Video chat";
}

function GenderArt({ kind }: { kind: "all" | "female" | "male" }) {
  if (kind === "all") {
    return (
      <svg viewBox="0 0 80 72" className="h-[58px] w-[70px]" aria-hidden="true">
        <circle cx="28" cy="20" r="10" fill="#f9a8d4" />
        <path d="M12 62c1-16 8-24 16-24s15 8 16 24" fill="#e879f9" />
        <circle cx="54" cy="18" r="10" fill="#c4b5fd" />
        <path d="M38 62c2-17 9-26 16-26s15 9 16 26" fill="#a78bfa" />
      </svg>
    );
  }
  if (kind === "female") {
    return (
      <svg viewBox="0 0 80 72" className="h-[58px] w-[58px]" aria-hidden="true">
        <path d="M40 8c8 0 14 6 14 14 0 2-.4 4-1 6 4 1 7 4 8 8-6-1-12 0-16 3-4-3-10-4-16-3 1-4 4-7 8-8-.6-2-1-4-1-6 0-8 6-14 14-14z" fill="#f9a8d4" />
        <circle cx="40" cy="24" r="9" fill="#fbcfe8" />
        <path d="M18 66c2-18 10-28 22-28s20 10 22 28" fill="#e879f9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 72" className="h-[58px] w-[58px]" aria-hidden="true">
      <circle cx="40" cy="20" r="10" fill="#ddd6fe" />
      <path d="M22 66c2-18 8-28 18-28s16 10 18 28" fill="#a78bfa" />
    </svg>
  );
}

function FollowMessageActions({
  following,
  busy,
  onFollow,
  onMessage,
  tone = "fill",
}: {
  following: boolean;
  busy?: boolean;
  onFollow: () => void;
  onMessage: () => void;
  tone?: ActionTone;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={onFollow}
        className={`yn-history-follow ${tone === "outline" ? "is-outline" : ""} ${following ? "is-on" : ""}`}
      >
        {following ? <Check size={14} strokeWidth={2.4} /> : null}
        {following ? "Following" : "Follow"}
      </button>
      <button
        type="button"
        onClick={onMessage}
        className={`yn-history-msg ${tone === "outline" ? "is-outline" : ""}`}
        aria-label="Message"
      >
        <MessageCircle size={16} />
      </button>
    </div>
  );
}

function ActivityKindLabel({ kind }: { kind: ActivityKind }) {
  if (kind === "perfect") {
    return (
      <span className="yn-history-kind is-perfect">
        <Sparkles size={12} strokeWidth={2.2} />
        Perfect match
      </span>
    );
  }
  if (kind === "updated") {
    return (
      <span className="yn-history-kind is-updated">
        <PencilLine size={12} strokeWidth={2.2} />
        Profile updated
      </span>
    );
  }
  return (
    <span className="yn-history-kind is-chat">
      <Video size={12} strokeWidth={2.2} />
      Video chat
    </span>
  );
}

function HistoryPersonCard({
  name,
  photo,
  country,
  showPhoto,
  online,
  timeLabel,
  kind,
  description,
  viewed,
  following,
  busy,
  tone,
  onOpenProfile,
  onFollow,
  onMessage,
}: {
  name: string;
  photo?: string;
  country?: string;
  showPhoto: boolean;
  online?: boolean;
  timeLabel: string;
  kind?: ActivityKind;
  description: string;
  viewed?: boolean;
  following: boolean;
  busy?: boolean;
  tone: ActionTone;
  onOpenProfile: () => void;
  onFollow: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="yn-history-row">
      <button
        type="button"
        className="shrink-0"
        onClick={onOpenProfile}
        aria-label={`View ${name}'s profile`}
      >
        <NeonAvatar
          className="yn-history-ring"
          src={photo}
          name={name}
          size={56}
          showPhoto={showPhoto}
          online={online}
        />
      </button>
      <button type="button" className="yn-history-body" onClick={onOpenProfile}>
        <span className="yn-history-name">
          <span className="truncate">{name}</span>
          {country ? (
            <CountryFlag country={country} size={14} className="shadow-none ring-1 ring-white/15" />
          ) : null}
        </span>
        {kind ? <ActivityKindLabel kind={kind} /> : null}
        {viewed ? <span className="yn-history-viewed">Viewed your profile</span> : null}
        {description ? <span className="yn-history-desc">{description}</span> : null}
      </button>
      <div className="yn-history-aside">
        <span className="yn-history-time">{timeLabel}</span>
        <FollowMessageActions
          following={following}
          busy={busy}
          tone={tone}
          onFollow={onFollow}
          onMessage={onMessage}
        />
      </div>
    </div>
  );
}

export function HistoryScreen({
  currentUserId,
  hasOwnPhoto = false,
  currentUser,
  onOpenChat,
  onOpenProfile,
}: HistoryScreenProps) {
  const [tab, setTab] = useState<HistoryTab>("recent");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [views, setViews] = useState<ProfileView[]>([]);
  const [liveById, setLiveById] = useState<Record<string, LiveProfile>>({});
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedFilter>(EMPTY_FILTER);
  const [draft, setDraft] = useState<AppliedFilter>(EMPTY_FILTER);
  const [updatedFocus, setUpdatedFocus] = useState<string | "all">("all");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const openProfile = (userId: string) => {
    if (onOpenProfile) {
      onOpenProfile(userId);
      return;
    }
    setPreviewUserId(userId);
  };

  const me: FollowSnapshot = {
    id: currentUser?.id || currentUserId || "",
    name: currentUser?.name,
    photo: currentUser?.photo,
    country: currentUser?.country,
    age: currentUser?.age,
  };
  const { followingIds, busyId, toggleFollow } = useFollowGraph(me.id || currentUserId);
  const blockedIds = useBlockedIds(me.id || currentUserId);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToHistory(currentUserId, (items) => {
      setHistory(
        (items as HistoryRow[]).map((item) => ({
          ...item,
          matchId: item.matchId || item.id,
        }))
      );
    });
    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setViews([]);
      return;
    }
    return subscribeToProfileViews(currentUserId, setViews);
  }, [currentUserId]);

  const partnerIds = useMemo(() => {
    const ids = [
      ...history.map((u) => u.matchId),
      ...views.map((v) => v.viewerId),
    ].filter(Boolean);
    return [...new Set(ids)];
  }, [history, views]);

  useEffect(() => {
    return subscribeToOnlineMap(partnerIds, setOnline);
  }, [partnerIds]);

  const idsKey = partnerIds.slice(0, 40).sort().join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",").filter(Boolean) : [];
    if (ids.length === 0) {
      setLiveById({});
      return;
    }
    let cancelled = false;
    Promise.all(
      ids.map(async (id) => {
        const profile = await getUserProfile(id).catch(() => null);
        if (!profile) return null;
        return [id, fromUserProfile(profile)] as const;
      })
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, LiveProfile> = {};
      rows.forEach((row) => {
        if (row) next[row[0]] = row[1];
      });
      setLiveById(next);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const enriched = useMemo(
    () => history.map((row) => mergeRow(row, liveById[row.matchId])),
    [history, liveById]
  );

  const perfectMatches = useMemo(() => pickPerfectMatches(enriched), [enriched]);

  const profileUpdated = useMemo(() => {
    const cutoff = Date.now() - PROFILE_UPDATE_WINDOW_MS;
    const seen = new Set<string>();
    const people: { id: string; name: string; photo: string }[] = [];
    enriched.forEach((row) => {
      const live = liveById[row.matchId];
      if (!live || seen.has(row.matchId)) return;
      if (live.lastProfileUpdateMs < cutoff) return;
      seen.add(row.matchId);
      people.push({ id: row.matchId, name: live.name || row.name, photo: live.photo || row.photo || "" });
    });
    return people;
  }, [enriched, liveById]);

  const filteredList = useMemo(() => {
    let rows = enriched.filter((r) => !blockedIds.has(r.matchId) && !blockedIds.has(r.id));
    if (updatedFocus !== "all") {
      rows = rows.filter((r) => r.matchId === updatedFocus);
    }
    if (applied.gender !== "all") {
      rows = rows.filter((r) => genderBucket(r.gender) === applied.gender);
    }
    if (applied.status === "online") {
      rows = rows.filter((r) => online[r.matchId]);
    }
    if (applied.sort === "long") {
      rows = [...rows].sort(
        (a, b) => (durationSecondsFromHistory(b) ?? -1) - (durationSecondsFromHistory(a) ?? -1)
      );
    }
    return rows;
  }, [enriched, applied, online, updatedFocus, blockedIds]);

  const perfectRowIds = useMemo(() => new Set(perfectMatches.map((u) => u.id)), [perfectMatches]);
  const perfectMatchIds = useMemo(
    () => new Set(perfectMatches.map((u) => u.matchId)),
    [perfectMatches]
  );
  const listWithoutCarouselDupes = useMemo(
    () => filteredList.filter((u) => !perfectRowIds.has(u.id)),
    [filteredList, perfectRowIds]
  );
  const visibleMatchIds = useMemo(() => {
    const ids = new Set(perfectMatchIds);
    listWithoutCarouselDupes.forEach((u) => ids.add(u.matchId));
    return ids;
  }, [perfectMatchIds, listWithoutCarouselDupes]);
  const extraUpdated = useMemo(
    () => profileUpdated.filter((person) => !visibleMatchIds.has(person.id)),
    [profileUpdated, visibleMatchIds]
  );
  const updatedRowIds = useMemo(() => {
    const seen = new Set<string>();
    const ids = new Set<string>();
    listWithoutCarouselDupes.forEach((u) => {
      if (seen.has(u.matchId)) return;
      if (!profileUpdated.some((person) => person.id === u.matchId)) return;
      seen.add(u.matchId);
      ids.add(u.id);
    });
    return ids;
  }, [listWithoutCarouselDupes, profileUpdated]);

  const openChat = useCallback(
    (user: { id: string; name: string; photo?: string; country?: string; countryFlag?: string }) => {
      if (!user.id) return;
      onOpenChat?.({
        id: user.id,
        name: user.name,
        avatar: user.name,
        photo: user.photo || "",
        country: user.country,
        countryFlag: user.countryFlag || user.country,
        isOnline: online[user.id] || false,
      });
    },
    [onOpenChat, online]
  );

  const followPerson = useCallback(
    (id: string, name: string, photo?: string, country?: string) => {
      if (!me.id || !id) return;
      toggleFollow(me, { id, name, photo: photo || "", country: country || "" });
    },
    [me, toggleFollow]
  );

  const openFilter = () => {
    setDraft(applied);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(draft);
    setFilterOpen(false);
  };

  return (
    <div className="yn-history">
      <div className="yn-history-head">
        <h1>History</h1>
      </div>

      <div className="yn-history-tabs">
        {(
          [
            { id: "recent", label: "Recent activity" },
            { id: "viewed", label: "Viewed me" },
          ] as const
        ).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`yn-history-tab ${active ? "is-on" : ""}`}
              data-testid={`history-tab-${item.id}`}
            >
              {item.label}
              {active ? <span className="yn-history-tab-line" /> : null}
            </button>
          );
        })}
      </div>

      {tab === "recent" ? (
        <div>
          {history.length === 0 ? (
            <div className="yn-history-empty">
              <p className="yn-history-empty-title">No video chats yet</p>
              <p className="yn-history-empty-sub">Start a random chat from Video Chat</p>
            </div>
          ) : (
            <>
              <div className="yn-history-toolbar">
                <div className="flex min-w-0 items-center gap-2">
                  {profileUpdated.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setUpdatedFocus("all")}
                      className={`yn-history-all ${updatedFocus === "all" ? "is-on" : ""}`}
                    >
                      All · {profileUpdated.length}
                    </button>
                  ) : null}
                  <p className="yn-history-filter-label">{filterLabel(applied)}</p>
                </div>
                <button
                  type="button"
                  onClick={openFilter}
                  className="yn-history-filter-btn"
                  aria-label="Filter recent activity"
                  data-testid="history-filter-btn"
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>

              {perfectMatches.map((u) => {
                const dur = displayDuration(u);
                const description =
                  dur && dur !== "—"
                    ? `You and ${u.name} matched · ${dur}`
                    : `You and ${u.name} matched`;
                return (
                  <HistoryPersonCard
                    key={`perfect-${u.id}`}
                    name={u.name}
                    photo={u.photo}
                    country={u.country || u.countryFlag}
                    showPhoto={hasOwnPhoto}
                    online={online[u.matchId]}
                    timeLabel={formatTimeAgo(u.timestamp)}
                    kind="perfect"
                    description={description}
                    following={followingIds.has(u.matchId)}
                    busy={busyId === u.matchId || !me.id}
                    tone="outline"
                    onOpenProfile={() => openProfile(u.matchId)}
                    onFollow={() =>
                      followPerson(u.matchId, u.name, u.photo, u.country || u.countryFlag)
                    }
                    onMessage={() =>
                      openChat({
                        id: u.matchId,
                        name: u.name,
                        photo: u.photo,
                        country: u.country,
                        countryFlag: u.countryFlag,
                      })
                    }
                  />
                );
              })}

              {extraUpdated.map((person) => {
                const live = liveById[person.id];
                const row = enriched.find((r) => r.matchId === person.id);
                const country = live?.country || row?.country || row?.countryFlag;
                return (
                  <HistoryPersonCard
                    key={`updated-${person.id}`}
                    name={person.name}
                    photo={person.photo}
                    country={country}
                    showPhoto={hasOwnPhoto}
                    online={online[person.id]}
                    timeLabel={formatTimeAgo(live?.lastProfileUpdateMs)}
                    kind="updated"
                    description="Recently updated their profile"
                    following={followingIds.has(person.id)}
                    busy={busyId === person.id || !me.id}
                    tone="outline"
                    onOpenProfile={() => openProfile(person.id)}
                    onFollow={() => followPerson(person.id, person.name, person.photo, country)}
                    onMessage={() =>
                      openChat({
                        id: person.id,
                        name: person.name,
                        photo: person.photo,
                        country,
                      })
                    }
                  />
                );
              })}

              {listWithoutCarouselDupes.length === 0 &&
              perfectMatches.length === 0 &&
              extraUpdated.length === 0 ? (
                <p className="yn-history-empty-sub py-10 text-center">No chats match this filter</p>
              ) : (
                listWithoutCarouselDupes.map((u) => {
                  const updated = updatedRowIds.has(u.id);
                  return (
                    <HistoryPersonCard
                      key={u.id}
                      name={u.name}
                      photo={u.photo}
                      country={u.country || u.countryFlag}
                      showPhoto={hasOwnPhoto}
                      online={online[u.matchId]}
                      timeLabel={formatTimeAgo(u.timestamp)}
                      kind={updated ? "updated" : "chat"}
                      description={
                        updated ? "Recently updated their profile" : chatDescription(u)
                      }
                      following={followingIds.has(u.matchId)}
                      busy={busyId === u.matchId || !me.id}
                      tone="outline"
                      onOpenProfile={() => openProfile(u.matchId)}
                      onFollow={() =>
                        followPerson(u.matchId, u.name, u.photo, u.country || u.countryFlag)
                      }
                      onMessage={() =>
                        openChat({
                          id: u.matchId,
                          name: u.name,
                          photo: u.photo,
                          country: u.country,
                          countryFlag: u.countryFlag,
                        })
                      }
                    />
                  );
                })
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          {views.length === 0 ? (
            <div className="yn-history-empty">
              <p className="yn-history-empty-title">No profile views yet</p>
              <p className="yn-history-empty-sub">
                When someone opens your profile in a call, they will show up here.
              </p>
            </div>
          ) : (
            views.map((view) => {
              const live = liveById[view.viewerId];
              const name = live?.name || view.name || view.viewerId;
              const photo = live?.photo || view.photo;
              const country = live?.country || view.country;
              const following = followingIds.has(view.viewerId);
              return (
                <HistoryPersonCard
                  key={view.id}
                  name={name}
                  photo={photo}
                  country={country}
                  showPhoto={hasOwnPhoto}
                  online={online[view.viewerId] || false}
                  timeLabel={formatTimeAgo(view.at)}
                  description=""
                  viewed
                  following={following}
                  busy={busyId === view.viewerId || !me.id}
                  tone="fill"
                  onOpenProfile={() => openProfile(view.viewerId)}
                  onFollow={() => followPerson(view.viewerId, name, photo, country)}
                  onMessage={() =>
                    openChat({
                      id: view.viewerId,
                      name,
                      photo,
                      country,
                    })
                  }
                />
              );
            })
          )}
        </div>
      )}

      {filterOpen ? (
        <div
          className="yn-history-sheet-scrim"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="yn-history-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Filter"
          >
            <div className="yn-history-sheet-handle" />
            <h3>Filter</h3>

            <p className="yn-history-sheet-label">Preferred Gender</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "female", label: "Female" },
                  { id: "male", label: "Male" },
                ] as const
              ).map((opt) => {
                const selected = draft.gender === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, gender: opt.id }))}
                    className={`yn-history-gender ${selected ? "is-on" : ""}`}
                  >
                    <GenderArt kind={opt.id} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="yn-history-sheet-label">Status</p>
            <div className="mt-2.5 flex gap-2">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "online", label: "Online" },
                ] as const
              ).map((opt) => {
                const selected = draft.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, status: opt.id }))}
                    className={`yn-history-chip ${selected ? "is-on" : ""}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <p className="yn-history-sheet-label">Sort</p>
            <div className="mt-1">
              {(
                [
                  { id: "recent", label: "Recent" },
                  { id: "long", label: "Long Chats" },
                ] as const
              ).map((opt) => {
                const selected = draft.sort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, sort: opt.id }))}
                    className="yn-history-sort"
                  >
                    <span className={`yn-history-radio ${selected ? "is-on" : ""}`}>
                      {selected ? <span /> : null}
                    </span>
                    <span className={selected ? "is-on" : ""}>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={applyFilter} className="yn-history-apply">
              Apply
            </button>
          </div>
        </div>
      ) : null}

      {onOpenProfile ? null : (
      <ProfilePreviewSheet
        open={!!previewUserId}
        onClose={() => setPreviewUserId(null)}
        userId={previewUserId || undefined}
        viewerId={me.id || currentUserId}
        standalone
        onMessage={(user) => {
          setPreviewUserId(null);
          openChat(user);
        }}
      />
      )}
    </div>
  );
}

function fromUserProfile(profile: UserProfile): LiveProfile {
  return {
    photo: profile.profilePicture || profile.photos?.[0] || "",
    name: profile.fullName || "",
    country: profile.country || profile.location || "",
    gender: profile.hideGender ? "" : profile.gender || "",
    languages: Array.isArray(profile.languages) ? profile.languages.filter(Boolean) : [],
    lastProfileUpdateMs: toMillis(profile.lastProfileUpdate) || toMillis(profile.updatedAt),
  };
}
