"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MessageCircle, MessageSquare, SlidersHorizontal } from "lucide-react";
import { NeonAvatar, isPhotoSrc } from "@/components/neon-avatar";
import { LoungeFilterSheet } from "@/components/lounge-filter-sheet";
import { CountryLabel } from "@/components/country-flag";
import {
  applyLoungeFilters,
  DEFAULT_LOUNGE_FILTERS,
  readStoredLoungeFilters,
  startLoungePresenceHeartbeat,
  storeLoungeFilters,
  subscribeToLoungePeople,
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

function CardPhoto({ src, name }: { src?: string; name: string }) {
  const photo = isPhotoSrc(src);
  if (photo) {
    return <img src={src} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background:
          "linear-gradient(160deg, #e879f9 0%, #a855f7 40%, #ec4899 78%, #6d28d9 100%)",
      }}
    >
      <NeonAvatar src="" name={name} size={72} showPhoto={false} />
    </div>
  );
}

function OnlineBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#16a34a] font-semibold text-white shadow-[0_0_10px_rgba(34,197,94,0.55)] ${
        compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      Online recently
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

  const [people, setPeople] = useState<LoungePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [applied, setApplied] = useState<LoungeFilters>(DEFAULT_LOUNGE_FILTERS);
  const [draft, setDraft] = useState<LoungeFilters>(DEFAULT_LOUNGE_FILTERS);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  const { followingIds, busyId, toggleFollow } = useFollowGraph(meId);
  const blockedIds = useBlockedIds(meId);

  useEffect(() => {
    const stored = readStoredLoungeFilters();
    setApplied(stored);
    setDraft(stored);
  }, []);

  useEffect(() => {
    if (!meId) {
      setPeople([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const stopHeartbeat = startLoungePresenceHeartbeat(meId);
    const unsub = subscribeToLoungePeople(meId, (next) => {
      setPeople(next);
      setLoading(false);
    });
    const safety = window.setTimeout(() => setLoading(false), 8000);
    return () => {
      stopHeartbeat();
      unsub();
      window.clearTimeout(safety);
    };
  }, [meId]);

  const { all, forYou } = useMemo(() => {
    const visible = people.filter((p) => !blockedIds.has(p.id));
    return applyLoungeFilters(visible, applied, me);
  }, [people, applied, me, blockedIds]);

  const filtersActive =
    applied.gender !== "all" ||
    applied.country !== "All" ||
    applied.language !== "All" ||
    applied.aroundMyAge;

  const openChat = (person: LoungePerson) => {
    onOpenChat?.({
      id: person.id,
      name: person.name,
      avatar: person.name,
      photo: person.photo,
      country: person.country,
      countryFlag: person.country,
      isOnline: Date.now() - person.lastSeenMs < 90_000,
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
  const featured = forYou[0];
  const mosaicSide = forYou.slice(1, 5);
  const mosaicRest = forYou.slice(5);

  return (
    <div
      className="min-h-full pb-8 text-[#f5f0ff]"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -12%, rgba(124, 58, 237, 0.28), transparent 55%), #07040f",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <h1 className="font-serif text-[32px] font-semibold leading-none tracking-tight text-white">
          Lounge
        </h1>
        <button
          type="button"
          onClick={() => {
            setDraft(applied);
            setFilterOpen(true);
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#c084fc] text-white shadow-[0_0_14px_rgba(168,85,247,0.55)] transition active:scale-95"
          aria-label="Filter lounge"
          data-testid="lounge-filter-btn"
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
          {filtersActive ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff4ec8] shadow-[0_0_8px_#ff4ec8]" />
          ) : null}
        </button>
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff4ec8]/12 ring-1 ring-[#c084fc]/40 shadow-[0_0_18px_rgba(255,78,200,0.25)]">
            <MessageSquare size={26} className="text-[#ff4ec8]" />
          </div>
          <p className="text-[16px] font-semibold text-white">No one in the Lounge yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#b9a8c9]">
            People who were recently online will appear here. Jump into Video Chat to meet someone live.
          </p>
        </div>
      ) : all.length === 0 ? (
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
            className="mx-auto mt-5 flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ff2bd6] px-6 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(255,43,214,0.32)]"
          >
            Adjust filters
          </button>
        </div>
      ) : (
        <>
          {forYou.length > 0 ? (
            <section className="pt-5">
              <h2 className="px-4 text-[16px] font-semibold tracking-tight text-white">For you</h2>
              <div className="mt-3 px-3">
                {mosaicSide.length === 0 && featured ? (
                  <div className="w-[52%]">
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
                ) : featured ? (
                  <div className="grid aspect-[4/3.05] grid-cols-4 grid-rows-2 gap-2">
                    <LoungeCard
                      person={featured}
                      variant="featured"
                      className="col-span-2 row-span-2"
                      following={followingIds.has(featured.id)}
                      busy={busyId === featured.id || !meId}
                      onFollow={() => followPerson(featured)}
                      onMessage={() => openChat(featured)}
                      onOpenProfile={() => setPreviewUserId(featured.id)}
                    />
                    {mosaicSide.map((person) => (
                      <LoungeCard
                        key={`fy-${person.id}`}
                        person={person}
                        variant="tile"
                        following={followingIds.has(person.id)}
                        busy={busyId === person.id || !meId}
                        onFollow={() => followPerson(person)}
                        onMessage={() => openChat(person)}
                        onOpenProfile={() => setPreviewUserId(person.id)}
                      />
                    ))}
                  </div>
                ) : null}
                {mosaicRest.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {mosaicRest.map((person) => (
                      <LoungeCard
                        key={`fy-${person.id}`}
                        person={person}
                        variant="all"
                        following={followingIds.has(person.id)}
                        busy={busyId === person.id || !meId}
                        onFollow={() => followPerson(person)}
                        onMessage={() => openChat(person)}
                        onOpenProfile={() => setPreviewUserId(person.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className={forYou.length > 0 ? "mt-6" : "mt-5"}>
            <h2 className="px-4 text-[16px] font-semibold tracking-tight text-white">All</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 px-3">
              {all.map((person) => (
                <LoungeCard
                  key={`all-${person.id}`}
                  person={person}
                  variant="all"
                  following={followingIds.has(person.id)}
                  busy={busyId === person.id || !meId}
                  onFollow={() => followPerson(person)}
                  onMessage={() => openChat(person)}
                  onOpenProfile={() => setPreviewUserId(person.id)}
                />
              ))}
            </div>
          </section>
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
  className = "",
}: {
  person: LoungePerson;
  variant: "featured" | "tile" | "all";
  following: boolean;
  busy: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onOpenProfile: () => void;
  className?: string;
}) {
  const featured = variant === "featured";
  const compact = variant === "tile";
  const title = person.age ? `${person.name}, ${person.age}` : person.name;

  return (
    <article
      className={`relative min-h-0 overflow-hidden rounded-[18px] border border-[#c084fc]/70 bg-[#0b0614] shadow-[0_0_16px_rgba(168,85,247,0.42),0_0_28px_rgba(255,78,200,0.12)] ${
        variant === "all" || (featured && !className) ? "aspect-[2/3]" : "h-full"
      } ${className}`}
    >
      <button
        type="button"
        className="absolute inset-0 z-0"
        onClick={onOpenProfile}
        aria-label={`View ${person.name}'s profile`}
      >
        <CardPhoto src={person.photo} name={person.name} />
      </button>
      <div className={`pointer-events-none absolute z-10 ${compact ? "left-1.5 top-1.5" : "left-2 top-2"}`}>
        <OnlineBadge compact={compact} />
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent ${
          compact ? "px-1.5 pb-1.5 pt-8" : featured ? "px-3 pb-3 pt-16" : "px-2.5 pb-2.5 pt-10"
        }`}
      >
        <p
          className={`truncate font-bold text-white ${
            featured ? "text-[16px]" : compact ? "text-[11px] leading-tight" : "text-[14px]"
          }`}
        >
          {title}
          {person.youneonBadge ? (
            <span className="ml-1 align-middle text-[10px] font-bold uppercase tracking-wide text-pink-300">
              Badge
            </span>
          ) : null}
        </p>
        {person.country ? (
          <CountryLabel
            country={person.country}
            size={compact ? 11 : 14}
            className={`text-white/90 ${compact ? "mt-0.5 text-[9px]" : "mt-0.5 text-[11px]"} font-medium`}
          />
        ) : null}
        <div className={`pointer-events-auto flex gap-1.5 ${compact ? "mt-1.5" : "mt-2"}`}>
          <button
            type="button"
            disabled={busy}
            onClick={onFollow}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-55 ${
              compact ? "h-7 text-[10px]" : featured ? "h-10 text-[12px]" : "h-9 text-[12px]"
            } ${
              following
                ? "border border-white/20 bg-black/35 text-white/80"
                : "bg-gradient-to-r from-[#7c3aed] to-[#ff2bd6] text-white shadow-[0_0_12px_rgba(255,43,214,0.35)]"
            }`}
            aria-label={following ? "Following" : "Follow"}
          >
            {following ? <Check size={compact ? 11 : 13} /> : <span className={compact ? "text-[12px]" : "text-[15px]"}>+</span>}
            {compact ? null : following ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            onClick={onMessage}
            className={`flex items-center justify-center rounded-full border border-[#c084fc]/80 bg-black/40 text-white backdrop-blur-sm shadow-[0_0_10px_rgba(192,132,252,0.35)] transition active:scale-[0.98] ${
              compact ? "h-7 w-7" : featured ? "h-10 min-w-0 flex-1 gap-1 text-[12px] font-semibold" : "h-9 w-9"
            }`}
            aria-label="Message"
          >
            <MessageCircle size={compact ? 12 : 14} />
            {featured ? "Message" : null}
          </button>
        </div>
      </div>
    </article>
  );
}

function LoungeSkeleton() {
  return (
    <div className="pt-5">
      <div className="px-4">
        <div className="h-4 w-20 rounded bg-white/8" />
      </div>
      <div className="mt-3 px-3">
        <div className="aspect-[4/3.05] animate-pulse rounded-[18px] bg-white/[0.06]" />
      </div>
      <div className="mt-6 px-4">
        <div className="h-4 w-10 rounded bg-white/8" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 px-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-[18px] bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
