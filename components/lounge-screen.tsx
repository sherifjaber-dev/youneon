"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Info, MapPin, MessageCircle, MessageSquare, SlidersHorizontal } from "lucide-react";
import { NeonAvatar, isPhotoSrc } from "@/components/neon-avatar";
import { LoungeFilterSheet } from "@/components/lounge-filter-sheet";
import { CountryLabel } from "@/components/country-flag";
import {
  applyLoungeFilters,
  DEFAULT_LOUNGE_FILTERS,
  haversineKm,
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
      className={`inline-flex items-center gap-1 rounded-full bg-black/55 text-white backdrop-blur-md ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      Online recently
    </span>
  );
}

function Tag({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex max-w-[110px] items-center gap-1 truncate rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
      {icon}
      <span className="truncate">{children}</span>
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

  return (
    <div className="min-h-full bg-yn-bg pb-8 text-yn-text">
      <div className="flex items-center justify-between px-4 pt-3">
        <h1 className="text-[22px] font-bold tracking-tight">Lounge</h1>
        <button
          type="button"
          onClick={() => {
            setDraft(applied);
            setFilterOpen(true);
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-yn-muted transition active:scale-95"
          aria-label="Filter lounge"
          data-testid="lounge-filter-btn"
        >
          <SlidersHorizontal size={20} />
          {filtersActive ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500" />
          ) : null}
        </button>
      </div>

      <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl border border-black/6 bg-yn-card px-3 py-2.5 shadow-sm">
        <Info size={15} className="mt-0.5 shrink-0 text-yn-accent" />
        <p className="text-[12px] leading-snug text-yn-muted">
          Start chatting with users who were recently online!
        </p>
      </div>

      {!adult ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-yn-text">YouNeon is 18+</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-yn-muted">
            Add your age (18 or older) in your profile to use Lounge. Minors cannot match or browse people here.
          </p>
        </div>
      ) : loading ? (
        <LoungeSkeleton />
      ) : people.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 to-pink-100 ring-1 ring-pink-200">
            <MessageSquare size={26} className="text-yn-accent" />
          </div>
          <p className="text-[16px] font-semibold text-yn-text">No one in the Lounge yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-yn-muted">
            People who were recently online will appear here. Jump into Video Chat to meet someone live.
          </p>
        </div>
      ) : all.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-yn-text">No matches for these filters</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-yn-muted">
            Try another country, language, or turn off Around My Age.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(applied);
              setFilterOpen(true);
            }}
            className="mx-auto mt-5 flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-[14px] font-semibold"
          >
            Adjust filters
          </button>
        </div>
      ) : (
        <>
          {forYou.length > 0 ? (
            <section className="pt-5">
              <h2 className="px-4 text-[16px] font-bold tracking-tight">For you</h2>
              <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {forYou.map((person) => (
                  <ForYouCard
                    key={`fy-${person.id}`}
                    person={person}
                    me={me}
                    following={followingIds.has(person.id)}
                    busy={busyId === person.id || !meId}
                    onFollow={() => followPerson(person)}
                    onMessage={() => openChat(person)}
                    onOpenProfile={() => setPreviewUserId(person.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className={forYou.length > 0 ? "mt-6" : "mt-5"}>
            <h2 className="px-4 text-[16px] font-bold tracking-tight">All</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 px-3">
              {all.map((person) => (
                <AllCard
                  key={`all-${person.id}`}
                  person={person}
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

function ForYouCard({
  person,
  me,
  following,
  busy,
  onFollow,
  onMessage,
  onOpenProfile,
}: {
  person: LoungePerson;
  me: LoungeMe;
  following: boolean;
  busy: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onOpenProfile: () => void;
}) {
  const language = person.languages[0]?.trim() || "";
  const km = haversineKm(me, person);
  const title = person.age ? `${person.name}, ${person.age}` : person.name;

  return (
    <article className="w-[236px] shrink-0 overflow-hidden rounded-[22px] border border-black/6 bg-yn-card shadow-[0_8px_24px_rgba(88,28,135,0.08)]">
      <div className="relative aspect-[3/4] overflow-hidden">
        <button
          type="button"
          className="absolute inset-0 z-0"
          onClick={onOpenProfile}
          aria-label={`View ${person.name}'s profile`}
        >
          <CardPhoto src={person.photo} name={person.name} />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-3 pb-3 pt-16">
          <p className="truncate text-[16px] font-bold text-white">
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
              size={16}
              className="mt-1 text-[11px] font-medium text-white/90"
            />
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {language ? (
              <Tag icon={<MessageCircle size={10} />}>{language}</Tag>
            ) : null}
            {km != null ? (
              <Tag icon={<MapPin size={10} />}>{km}km</Tag>
            ) : null}
            <Tag icon={<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}>
              Online recently
            </Tag>
          </div>
          <div className="pointer-events-auto mt-2.5 flex gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={onFollow}
              className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-55 ${
                following
                  ? "border border-white/16 bg-white/[0.1] text-white/85"
                  : "bg-white/14 text-white"
              }`}
            >
              {following ? <Check size={13} /> : <span className="text-[15px]">+</span>}
              {following ? "Following" : "Follow"}
            </button>
            <button
              type="button"
              onClick={onMessage}
              className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-black/45 text-[12px] font-semibold text-white backdrop-blur-sm transition active:scale-[0.98]"
            >
              <MessageCircle size={13} />
              Message
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function AllCard({
  person,
  following,
  busy,
  onFollow,
  onMessage,
  onOpenProfile,
}: {
  person: LoungePerson;
  following: boolean;
  busy: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onOpenProfile: () => void;
}) {
  const language = person.languages[0]?.trim() || "";
  const title = person.age ? `${person.name}, ${person.age}` : person.name;

  return (
    <article className="overflow-hidden rounded-[20px] border border-black/6 bg-yn-card shadow-[0_8px_20px_rgba(88,28,135,0.07)]">
      <div className="relative aspect-[3/4] overflow-hidden">
        <button
          type="button"
          className="absolute inset-0 z-0"
          onClick={onOpenProfile}
          aria-label={`View ${person.name}'s profile`}
        >
          <CardPhoto src={person.photo} name={person.name} />
        </button>
        <div className="pointer-events-none absolute left-2 top-2 z-10">
          <OnlineBadge compact />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/88 via-black/40 to-transparent px-2.5 pb-2.5 pt-10">
          <p className="truncate text-[14px] font-bold text-white">
            {title}
            {person.youneonBadge ? (
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-pink-300">Badge</span>
            ) : null}
          </p>
          {person.country ? (
            <CountryLabel
              country={person.country}
              size={16}
              className="mt-0.5 text-[11px] font-medium text-white/90"
            />
          ) : null}
          {language ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/70">
              <MessageCircle size={11} />
              {language}
            </p>
          ) : null}
          <div className="pointer-events-auto mt-2 flex gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={onFollow}
              className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-full text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-55 ${
                following
                  ? "border border-white/16 bg-white/[0.1] text-white"
                  : "bg-white/16 text-white"
              }`}
              aria-label={following ? "Following" : "Follow"}
            >
              {following ? <Check size={15} /> : "+"}
            </button>
            <button
              type="button"
              onClick={onMessage}
              className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-[0.98]"
              aria-label="Message"
            >
              <MessageCircle size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoungeSkeleton() {
  return (
    <div className="pt-5">
      <div className="px-4">
        <div className="h-4 w-20 rounded bg-black/8" />
      </div>
      <div className="mt-3 flex gap-3 overflow-hidden px-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-[300px] w-[236px] shrink-0 animate-pulse rounded-[22px] bg-black/[0.06]"
          />
        ))}
      </div>
      <div className="mt-6 px-4">
        <div className="h-4 w-10 rounded bg-black/8" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 px-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-[20px] bg-black/[0.06]" />
        ))}
      </div>
    </div>
  );
}
