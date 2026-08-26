"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { isPhotoSrc } from "@/components/neon-avatar";
import { LoungeFilterSheet } from "@/components/lounge-filter-sheet";
import { CountryFlag } from "@/components/country-flag";
import {
  applyLoungeFilters,
  DEFAULT_LOUNGE_FILTERS,
  isLoungeOnline,
  LOUNGE_MAX,
  LOUNGE_PAGE_SIZE,
  readStoredLoungeFilters,
  sortLoungeFeed,
  startLoungePresenceHeartbeat,
  storeLoungeFilters,
  subscribeToLoungePeople,
  type LoungeFeedChip,
  type LoungeFilters,
  type LoungeMe,
  type LoungePerson,
} from "@/lib/lounge-service";
import { ProfilePreviewSheet } from "@/components/call-remote-profile";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { useBlockedIds } from "@/hooks/use-user-settings";
import { isAdultAge } from "@/lib/safety";
import type { FollowSnapshot } from "@/lib/follow-service";

export type LoungeChatTarget = {
  id: string;
  name: string;
  avatar: string;
  photo?: string;
  countryFlag?: string;
  country?: string;
  isOnline?: boolean;
};

interface LoungeScreenProps {
  currentUserId?: string;
  currentUser?: LoungeMe;
  onOpenChat?: (user: LoungeChatTarget) => void;
}

const CHIPS: { id: LoungeFeedChip; label: string }[] = [
  { id: "forYou", label: "For you" },
  { id: "nearby", label: "Nearby" },
  { id: "popular", label: "Popular" },
  { id: "new", label: "New" },
];

function CardPhoto({ src }: { src?: string }) {
  const photo = isPhotoSrc(src);
  if (photo) {
    return <img src={src} alt="" className="h-full w-full object-cover" />;
  }
  return <div className="yn-lounge-photo-fallback" />;
}

function PresenceBadge({ online }: { online: boolean }) {
  return (
    <span className={`yn-lounge-pill ${online ? "is-live" : ""}`}>
      <span className="yn-lounge-pill-dot" />
      {online ? "Online" : "Online recently"}
    </span>
  );
}

export function LoungeScreen({
  currentUserId,
  currentUser,
  onOpenChat,
}: LoungeScreenProps) {
  const meId = currentUser?.id || currentUserId || "";
  const me: LoungeMe = {
    id: meId,
    name: currentUser?.name,
    photo: currentUser?.photo,
    country: currentUser?.country,
    age: currentUser?.age,
    gender: currentUser?.gender,
    languages: currentUser?.languages,
    lat: currentUser?.lat,
    lng: currentUser?.lng,
  };
  const followMe: FollowSnapshot = {
    id: meId,
    name: me.name,
    photo: me.photo,
    country: me.country,
    age: me.age,
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const pulling = useRef(false);
  const pullPxRef = useRef(0);

  const [people, setPeople] = useState<LoungePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize, setPageSize] = useState(LOUNGE_PAGE_SIZE);
  const [refreshTick, setRefreshTick] = useState(0);
  const [pullPx, setPullPx] = useState(0);
  const [chip, setChip] = useState<LoungeFeedChip>("forYou");
  const [filterOpen, setFilterOpen] = useState(false);
  const [applied, setApplied] = useState<LoungeFilters>(DEFAULT_LOUNGE_FILTERS);
  const [draft, setDraft] = useState<LoungeFilters>(DEFAULT_LOUNGE_FILTERS);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  const { followingIds, busyId, toggleFollow } = useFollowGraph(meId);
  const blockedIds = useBlockedIds(meId);
  const loadedCountRef = useRef(0);
  loadedCountRef.current = people.length;

  useEffect(() => {
    const stored = readStoredLoungeFilters();
    setApplied(stored);
    setDraft(stored);
  }, []);

  useEffect(() => {
    if (!meId) {
      setPeople([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    const firstPage = pageSize <= LOUNGE_PAGE_SIZE;
    if (firstPage && loadedCountRef.current === 0) setLoading(true);
    else if (!firstPage) setLoadingMore(true);
    const stopHeartbeat = startLoungePresenceHeartbeat(meId);
    const unsub = subscribeToLoungePeople(
      meId,
      (next, meta) => {
        setPeople(next);
        setHasMore(!!meta?.hasMore);
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      },
      { pageSize }
    );
    const safety = window.setTimeout(() => {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }, 8000);
    return () => {
      stopHeartbeat();
      unsub();
      window.clearTimeout(safety);
    };
  }, [meId, pageSize, refreshTick]);

  const filtered = useMemo(() => {
    const visible = people.filter((p) => !blockedIds.has(p.id));
    return applyLoungeFilters(visible, applied, me).all;
  }, [people, applied, me, blockedIds]);

  const feed = useMemo(() => sortLoungeFeed(filtered, chip, me), [filtered, chip, me]);
  const liveNow = useMemo(
    () => filtered.filter((p) => isLoungeOnline(p.lastSeenMs)),
    [filtered]
  );

  const featured = chip === "forYou" ? feed[0] : undefined;
  const grid = chip === "forYou" ? feed.slice(1) : feed;

  const filtersActive =
    applied.gender !== "all" ||
    applied.country !== "All" ||
    applied.language !== "All" ||
    applied.aroundMyAge;

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore || refreshing) return;
    setPageSize((n) => Math.min(LOUNGE_MAX, n + LOUNGE_PAGE_SIZE));
  }, [hasMore, loading, loadingMore, refreshing]);

  const refresh = useCallback(() => {
    if (refreshing || loading) return;
    setRefreshing(true);
    setPageSize(LOUNGE_PAGE_SIZE);
    setRefreshTick((n) => n + 1);
  }, [refreshing, loading]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || refreshing) return;
    if (grid.length >= 8) return;
    loadMore();
  }, [grid.length, hasMore, loading, loadingMore, refreshing, loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    const root = rootRef.current;
    if (!node) return;
    const scroller = (root?.closest(".overflow-y-auto") as HTMLElement | null) || null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: scroller, rootMargin: "160px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore, feed.length, loading]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scroller =
      (root.closest(".overflow-y-auto") as HTMLElement | null) ||
      (root.parentElement as HTMLElement | null) ||
      root;

    const onStart = (e: TouchEvent) => {
      if (scroller.scrollTop > 2) {
        pulling.current = false;
        return;
      }
      pulling.current = true;
      pullStartY.current = e.touches[0]?.clientY || 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const y = e.touches[0]?.clientY || 0;
      const dy = y - pullStartY.current;
      if (dy <= 0 || scroller.scrollTop > 2) {
        pullPxRef.current = 0;
        setPullPx(0);
        return;
      }
      const next = Math.min(88, dy * 0.42);
      pullPxRef.current = next;
      setPullPx(next);
    };
    const onEnd = () => {
      const shouldRefresh = pullPxRef.current > 52;
      pulling.current = false;
      pullPxRef.current = 0;
      setPullPx(0);
      if (shouldRefresh) refresh();
    };

    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: true });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
    };
  }, [refresh]);

  const openChat = (person: LoungePerson) => {
    onOpenChat?.({
      id: person.id,
      name: person.name,
      avatar: person.name,
      photo: person.photo,
      country: person.country,
      countryFlag: person.country,
      isOnline: isLoungeOnline(person.lastSeenMs),
    });
  };

  const followPerson = (person: LoungePerson) => {
    void toggleFollow(followMe, {
      id: person.id,
      name: person.name,
      photo: person.photo,
      country: person.country,
      age: person.age,
    });
  };

  const saveFilters = () => {
    setApplied(draft);
    storeLoungeFilters(draft);
    setFilterOpen(false);
  };

  const adult = isAdultAge(me.age);
  const pullOffset = refreshing ? 44 : pullPx;

  return (
    <div ref={rootRef} className="yn-lounge min-h-full pb-8">
      <div
        className="yn-lounge-refresh"
        style={{ height: pullOffset, opacity: pullOffset > 8 || refreshing ? 1 : 0 }}
        aria-hidden
      >
        <span className={`yn-lounge-refresh-dot ${refreshing ? "is-spin" : ""}`} />
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <h1 className="yn-lounge-title">Lounge</h1>
        <button
          type="button"
          onClick={() => {
            setDraft(applied);
            setFilterOpen(true);
          }}
          className="yn-lounge-filter-btn"
          aria-label="Filter lounge"
          data-testid="lounge-filter-btn"
        >
          <img src="/youneon/lounge-filter.png" alt="" draggable={false} />
          {filtersActive ? <span className="yn-lounge-filter-dot" /> : null}
        </button>
      </div>

      <div className="yn-lounge-chips" role="tablist" aria-label="Lounge sorts">
        {CHIPS.map((row) => {
          const on = chip === row.id;
          return (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setChip(row.id)}
              className={`yn-lounge-chip ${on ? "is-on" : ""}`}
            >
              {row.label}
            </button>
          );
        })}
      </div>

      {!adult ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-white">YouNeon is 18+</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#b9a8c9]">
            Add your age (18 or older) in your profile to use Lounge. Minors cannot match or browse people here.
          </p>
        </div>
      ) : loading ? (
        <LoungeSkeleton />
      ) : people.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF2EC8]/12 ring-1 ring-[#A855F7]/40 shadow-[0_0_18px_rgba(255,46,200,0.25)]">
            <MessageSquare size={26} className="text-[#FF2EC8]" />
          </div>
          <p className="text-[16px] font-semibold text-white">No one in the Lounge yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#b9a8c9]">
            People who were recently online will appear here. Jump into Video Chat to meet someone live.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-white">No matches for these filters</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#b9a8c9]">
            Try another country, language, or turn off Around My Age.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(applied);
              setFilterOpen(true);
            }}
            className="yn-lounge-empty-cta"
          >
            Adjust filters
          </button>
        </div>
      ) : (
        <>
          {liveNow.length > 0 ? (
            <section className="yn-lounge-live" aria-label="Live now">
              <h2 className="yn-lounge-live-title">Live now</h2>
              <div className="yn-lounge-live-row">
                {liveNow.map((person) => (
                  <button
                    key={`live-${person.id}`}
                    type="button"
                    className="yn-lounge-live-item"
                    onClick={() => setPreviewUserId(person.id)}
                    aria-label={`${person.name} is live`}
                  >
                    <span className="yn-lounge-live-ring">
                      {isPhotoSrc(person.photo) ? (
                        <img src={person.photo} alt="" />
                      ) : (
                        <span className="yn-lounge-photo-fallback is-round" />
                      )}
                    </span>
                    <span className="yn-lounge-live-badge">LIVE</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {featured ? (
            <div className="px-4">
              <LoungeCard
                person={featured}
                variant="featured"
                following={followingIds.has(featured.id)}
                busy={busyId === featured.id || !meId}
                onFollow={() => followPerson(featured)}
                onMessage={() => openChat(featured)}
                onOpenProfile={() => setPreviewUserId(featured.id)}
              />
            </div>
          ) : null}

          {grid.length > 0 ? (
            <div className="yn-lounge-grid">
              {grid.map((person) => (
                <LoungeCard
                  key={person.id}
                  person={person}
                  variant="card"
                  following={followingIds.has(person.id)}
                  busy={busyId === person.id || !meId}
                  onFollow={() => followPerson(person)}
                  onMessage={() => openChat(person)}
                  onOpenProfile={() => setPreviewUserId(person.id)}
                />
              ))}
            </div>
          ) : null}

          <div ref={sentinelRef} className="h-6" />
          {loadingMore ? <p className="yn-lounge-more">Loading more…</p> : null}
        </>
      )}

      {filterOpen ? (
        <LoungeFilterSheet
          draft={draft}
          onChange={setDraft}
          onSave={saveFilters}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}

      <ProfilePreviewSheet
        open={!!previewUserId}
        onClose={() => setPreviewUserId(null)}
        userId={previewUserId || undefined}
        viewerId={meId}
        standalone
        onMessage={(user) => {
          setPreviewUserId(null);
          onOpenChat?.(user);
        }}
      />
    </div>
  );
}

function LoungeCard({
  person,
  variant,
  following,
  busy,
  onFollow,
  onMessage,
  onOpenProfile,
}: {
  person: LoungePerson;
  variant: "featured" | "card";
  following: boolean;
  busy: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onOpenProfile: () => void;
}) {
  const featured = variant === "featured";
  const online = isLoungeOnline(person.lastSeenMs);
  const title = person.age ? `${person.name} ${person.age}` : person.name;

  return (
    <article className={`yn-lounge-card ${featured ? "is-featured" : ""}`}>
      <button
        type="button"
        className="yn-lounge-card-photo"
        onClick={onOpenProfile}
        aria-label={`View ${person.name}'s profile`}
      >
        <CardPhoto src={person.photo} />
      </button>
      <div className="yn-lounge-card-top">
        <PresenceBadge online={online} />
      </div>
      <div className="yn-lounge-card-meta">
        <p className="yn-lounge-card-name">{title}</p>
        {person.country ? (
          <CountryFlag country={person.country} size={featured ? 14 : 12} />
        ) : null}
        <div className="yn-lounge-card-actions">
          <button
            type="button"
            disabled={busy}
            onClick={onFollow}
            className={`yn-lounge-follow ${following ? "is-on" : ""}`}
            aria-label={following ? "Following" : "Follow"}
          >
            {following ? (
              <Check size={featured ? 14 : 12} />
            ) : (
              <span className="text-[13px] leading-none">+</span>
            )}
            {following ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            onClick={onMessage}
            className="yn-lounge-message"
            aria-label="Message"
          >
            <img src="/youneon/lounge-message.png" alt="" draggable={false} />
            Message
          </button>
        </div>
      </div>
    </article>
  );
}

function LoungeSkeleton() {
  return (
    <div className="pt-4">
      <div className="yn-lounge-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="yn-lounge-skel" />
        ))}
      </div>
    </div>
  );
}
