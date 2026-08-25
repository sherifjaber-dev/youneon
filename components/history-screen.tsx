"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, MessageCircle, SlidersHorizontal, Video } from "lucide-react";
import { ProfilePreviewSheet } from "@/components/call-remote-profile";
import { NeonAvatar, isPhotoSrc, neonInitial } from "@/components/neon-avatar";
import { getUserProfile, subscribeToHistory, type UserProfile } from "@/lib/firestore-service";
import { subscribeToOnlineMap, type FollowSnapshot } from "@/lib/follow-service";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { useBlockedIds } from "@/hooks/use-user-settings";
import { countryToFlag } from "@/lib/countries";
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
}

type HistoryTab = "recent" | "viewed";
type StatusFilter = "all" | "online";
type SortFilter = "recent" | "long";

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

function SquarePhoto({
  src,
  name,
  size,
  showPhoto,
}: {
  src?: string;
  name: string;
  size: number;
  showPhoto: boolean;
}) {
  const photo = showPhoto && isPhotoSrc(src);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[18px] bg-[#1a0828]"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background:
              "linear-gradient(160deg, #e879f9 0%, #a855f7 40%, #ec4899 78%, #6d28d9 100%)",
          }}
        >
          <span className="text-[22px] font-bold text-white drop-shadow-[0_2px_10px_rgba(88,28,135,0.55)]">
            {neonInitial(name)}
          </span>
        </div>
      )}
    </div>
  );
}

function FollowMessageActions({
  following,
  busy,
  onFollow,
  onMessage,
  followWidth = "wide",
}: {
  following: boolean;
  busy?: boolean;
  onFollow: () => void;
  onMessage: () => void;
  followWidth?: "wide" | "compact";
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={onFollow}
        className={`flex h-11 items-center justify-center gap-1 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-55 ${
          followWidth === "wide" ? "min-w-[92px]" : "min-w-[84px]"
        } ${
          following
            ? "border border-white/16 bg-white/[0.06] text-white/80"
            : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.32)]"
        }`}
      >
        {following ? <Check size={14} strokeWidth={2.4} /> : null}
        {following ? "Following" : "Follow"}
      </button>
      <button
        type="button"
        onClick={onMessage}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.07] text-white transition active:scale-[0.96]"
        aria-label="Message"
      >
        <MessageCircle size={16} />
      </button>
    </div>
  );
}

export function HistoryScreen({
  currentUserId,
  hasOwnPhoto = false,
  currentUser,
  onOpenChat,
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

  const openChat = useCallback(
    (user: { id: string; name: string; photo?: string; country?: string; countryFlag?: string }) => {
      if (!user.id) return;
      onOpenChat?.({
        id: user.id,
        name: user.name,
        avatar: user.name,
        photo: user.photo || "",
        country: user.country,
        countryFlag: countryToFlag(user.countryFlag || user.country),
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
    <div className="min-h-full bg-[#0f0117] pb-8 text-white">
      <div className="px-4 pt-3">
        <h1 className="text-[22px] font-bold tracking-tight">History</h1>
      </div>

      <div className="sticky top-0 z-10 mt-2 bg-[#0f0117]/92 backdrop-blur-md">
        <div className="flex px-2">
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
                className={`relative flex h-12 flex-1 items-center justify-center px-2 text-[15px] font-semibold transition ${
                  active ? "text-white" : "text-white/40"
                }`}
                data-testid={`history-tab-${item.id}`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-6 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-white/8" />
      </div>

      {tab === "recent" ? (
        <div>
          {history.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[16px] font-semibold text-white">No video chats yet</p>
              <p className="mt-1.5 text-sm text-white/40">Start a random chat from Discover</p>
            </div>
          ) : (
            <>
              {perfectMatches.length > 0 ? (
                <section className="pt-4">
                  <h2 className="px-4 text-[16px] font-bold tracking-tight">A perfect match for you!</h2>
                  <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {perfectMatches.map((u) => {
                      const flag = countryToFlag(u.countryFlag || u.country);
                      const following = followingIds.has(u.matchId);
                      const photo = hasOwnPhoto && isPhotoSrc(u.photo);
                      return (
                        <article
                          key={`perfect-${u.id}`}
                          className="w-[210px] shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#1a0828] shadow-[0_12px_28px_rgba(76,29,149,0.22)]"
                        >
                          <button
                            type="button"
                            className="relative aspect-[3/4] w-full overflow-hidden"
                            onClick={() => setPreviewUserId(u.matchId)}
                            aria-label={`View ${u.name}'s profile`}
                          >
                            {photo ? (
                              <img src={u.photo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div
                                className="flex h-full w-full items-center justify-center"
                                style={{
                                  background:
                                    "linear-gradient(160deg, #e879f9 0%, #a855f7 40%, #ec4899 78%, #6d28d9 100%)",
                                }}
                              >
                                <span className="text-[42px] font-bold text-white">
                                  {neonInitial(u.name)}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-10">
                              <p className="truncate text-[15px] font-bold text-white">
                                {flag ? <span className="mr-1">{flag}</span> : null}
                                {u.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-white/75">
                                {formatHistoryWhen(u.timestamp)}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[12px] text-white/85">
                                <Video size={13} />
                                {displayDuration(u)}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center gap-1.5 px-2.5 py-2.5">
                            <button
                              type="button"
                              disabled={busyId === u.matchId || !me.id}
                              onClick={() =>
                                followPerson(u.matchId, u.name, u.photo, u.country || u.countryFlag)
                              }
                              className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-55 ${
                                following
                                  ? "border border-white/16 bg-white/[0.06] text-white/80"
                                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                              }`}
                            >
                              {following ? <Check size={13} /> : <span className="text-[15px]">+</span>}
                              {following ? "Following" : "Follow"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openChat({
                                  id: u.matchId,
                                  name: u.name,
                                  photo: u.photo,
                                  country: u.country,
                                  countryFlag: u.countryFlag,
                                })
                              }
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
                              aria-label="Message"
                            >
                              <MessageCircle size={16} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {profileUpdated.length > 0 ? (
                <section className="mt-5">
                  <h2 className="px-4 text-[16px] font-bold tracking-tight">Profile Updated</h2>
                  <div className="mt-3 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setUpdatedFocus("all")}
                      className="flex w-[58px] shrink-0 flex-col items-center gap-1.5"
                    >
                      <span
                        className={`flex h-[54px] w-[54px] items-center justify-center rounded-full text-[17px] font-bold ${
                          updatedFocus === "all"
                            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_0_16px_rgba(236,72,153,0.35)]"
                            : "bg-white/10 text-white/80"
                        }`}
                      >
                        {profileUpdated.length}
                      </span>
                      <span className="text-[12px] font-semibold text-white/70">All</span>
                    </button>
                    {profileUpdated.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => setPreviewUserId(person.id)}
                        className="flex w-[58px] shrink-0 flex-col items-center gap-1.5"
                        aria-label={`View ${person.name}'s profile`}
                      >
                        <span className="relative">
                          <NeonAvatar
                            src={person.photo}
                            name={person.name}
                            size={54}
                            showPhoto={hasOwnPhoto}
                          />
                          {updatedFocus === person.id ? (
                            <span className="absolute -inset-0.5 rounded-full ring-2 ring-pink-400" />
                          ) : (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pink-500 shadow-[0_0_0_2px_#0f0117]" />
                          )}
                        </span>
                        <span className="w-full truncate text-center text-[12px] font-medium text-white/70">
                          {person.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mt-5 flex h-12 items-center justify-between px-4">
                <p className="text-[15px] font-semibold text-white/55">{filterLabel(applied)}</p>
                <button
                  type="button"
                  onClick={openFilter}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition active:scale-95"
                  aria-label="Filter recent activity"
                  data-testid="history-filter-btn"
                >
                  <SlidersHorizontal size={20} />
                </button>
              </div>

              <div className="space-y-1 px-3">
                {filteredList.length === 0 ? (
                  <p className="py-10 text-center text-sm text-white/40">No chats match this filter</p>
                ) : (
                  filteredList.map((u) => {
                    const flag = countryToFlag(u.countryFlag || u.country);
                    const following = followingIds.has(u.matchId);
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 rounded-2xl px-1 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewUserId(u.matchId)}
                          aria-label={`View ${u.name}'s profile`}
                          className="shrink-0"
                        >
                          <SquarePhoto
                            src={u.photo}
                            name={u.name}
                            size={82}
                            showPhoto={hasOwnPhoto}
                          />
                        </button>
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setPreviewUserId(u.matchId)}
                        >
                          <p className="truncate text-[16px] font-bold text-white">
                            {u.name}
                            {flag ? <span className="ml-1.5 font-normal">{flag}</span> : null}
                          </p>
                          <p className="mt-0.5 text-[12px] text-white/45">
                            {formatHistoryWhen(u.timestamp)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[12px] text-white/50">
                            <Video size={13} />
                            {displayDuration(u)}
                          </p>
                        </button>
                        <FollowMessageActions
                          following={following}
                          busy={busyId === u.matchId || !me.id}
                          followWidth="compact"
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
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <h2 className="text-[16px] font-bold tracking-tight">Last 30 days</h2>
          {views.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[16px] font-semibold text-white">No profile views yet</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/40">
                When someone opens your profile in a call, they will show up here.
              </p>
            </div>
          ) : (
            <div className="mt-2 divide-y divide-white/6">
              {views.map((view) => {
                const live = liveById[view.viewerId];
                const name = live?.name || view.name || view.viewerId;
                const photo = live?.photo || view.photo;
                const country = live?.country || view.country;
                const flag = countryToFlag(country);
                const language = (live?.languages?.[0] || view.languages?.[0] || "").trim();
                const following = followingIds.has(view.viewerId);
                return (
                  <div key={view.id} className="flex items-center gap-3 py-3">
                    <button
                      type="button"
                      className="shrink-0"
                      onClick={() => setPreviewUserId(view.viewerId)}
                      aria-label={`View ${name}'s profile`}
                    >
                      <NeonAvatar
                        src={photo}
                        name={name}
                        size={56}
                        showPhoto={hasOwnPhoto}
                        online={online[view.viewerId] || false}
                      />
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setPreviewUserId(view.viewerId)}
                    >
                      <p className="truncate text-[16px] font-bold text-white">{name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-white/45">
                        {flag ? <span>{flag}</span> : null}
                        {flag && language ? <span> · </span> : null}
                        {language || (!flag ? "Recent viewer" : "")}
                      </p>
                    </button>
                    <FollowMessageActions
                      following={following}
                      busy={busyId === view.viewerId || !me.id}
                      followWidth="compact"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {filterOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/65 backdrop-blur-[2px]"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="w-full rounded-t-[28px] border-t border-white/10 bg-[#16061f] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(88,28,135,0.35)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Filter"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
            <h3 className="text-[26px] font-bold tracking-tight">Filter</h3>

            <p className="mt-5 text-[13px] font-bold uppercase tracking-wide text-white/40">
              Preferred Gender
            </p>
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
                    className={`flex h-[118px] flex-col items-center justify-center rounded-2xl border transition ${
                      selected
                        ? "border-pink-400/80 bg-pink-500/12 shadow-[0_0_18px_rgba(236,72,153,0.18)]"
                        : "border-white/8 bg-white/[0.04]"
                    }`}
                  >
                    <GenderArt kind={opt.id} />
                    <span
                      className={`mt-1 text-[14px] font-semibold ${
                        selected ? "text-white" : "text-white/45"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-[13px] font-bold uppercase tracking-wide text-white/40">Status</p>
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
                    className={`h-11 min-w-[72px] rounded-full px-5 text-[14px] font-semibold ${
                      selected
                        ? "border border-pink-400/70 bg-pink-500/15 text-white"
                        : "border border-transparent bg-white/8 text-white/45"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-[13px] font-bold uppercase tracking-wide text-white/40">Sort</p>
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
                    className="flex h-12 w-full items-center gap-3"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                        selected ? "border-pink-400" : "border-white/25"
                      }`}
                    >
                      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-pink-400" /> : null}
                    </span>
                    <span className={`text-[16px] ${selected ? "font-semibold text-white" : "text-white/45"}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={applyFilter}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(168,85,247,0.4)]"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}

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
