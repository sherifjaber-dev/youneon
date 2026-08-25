"use client";

import { useState } from "react";
import { ArrowLeft, MessageCircle, UserPlus, Users } from "lucide-react";
import { isPhotoSrc, neonInitial } from "@/components/neon-avatar";
import { countryToFlag } from "@/lib/countries";
import type { FollowPerson } from "@/lib/follow-service";

export type ChatTarget = {
  id: string;
  name: string;
  avatar: string;
  photo?: string;
  countryFlag?: string;
  country?: string;
  isOnline?: boolean;
};

interface FollowersScreenProps {
  initialTab?: "followers" | "following";
  currentUserId: string;
  hasOwnPhoto?: boolean;
  followers: FollowPerson[];
  following: FollowPerson[];
  followingIds: Set<string>;
  online: Record<string, boolean>;
  busyId: string | null;
  onBack: () => void;
  onToggleFollow: (person: FollowPerson) => void;
  onOpenChat: (user: ChatTarget) => void;
}

function toChatTarget(person: FollowPerson, online?: boolean): ChatTarget {
  return {
    id: person.id,
    name: person.name,
    avatar: person.name,
    photo: person.photo,
    country: person.country,
    countryFlag: countryToFlag(person.country),
    isOnline: !!online,
  };
}

export function FollowersScreen({
  initialTab = "followers",
  currentUserId,
  hasOwnPhoto = false,
  followers,
  following,
  followingIds,
  online,
  busyId,
  onBack,
  onToggleFollow,
  onOpenChat,
}: FollowersScreenProps) {
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const people = tab === "followers" ? followers : following;
  const emptyCopy =
    tab === "followers"
      ? {
          title: "No followers yet",
          body: "When someone follows you, they show up here so you can start a chat.",
        }
      : {
          title: "You are not following anyone",
          body: "Follow people from History or here after they follow you.",
        };

  return (
    <div className="min-h-full bg-[#0f0117] pb-6 text-white">
      <div className="sticky top-0 z-10 yn-glass border-b border-white/8 px-2 pt-1">
        <div className="flex h-12 items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition active:scale-95"
            aria-label="Back to messages"
            data-testid="followers-back-btn"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight">
            {tab === "following" ? "Following" : "Followers"}
          </h1>
        </div>
        <div className="mt-1 flex gap-2 px-2 pb-3">
          {(
            [
              { id: "followers", label: "Followers", count: followers.length },
              { id: "following", label: "Following", count: following.length },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`h-10 min-w-[44px] flex-1 rounded-full text-[13px] font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_4px_14px_rgba(168,85,247,0.35)]"
                    : "border border-white/10 bg-white/[0.04] text-white/55"
                }`}
                data-testid={`people-tab-${item.id}`}
              >
                {item.label} {item.count > 0 ? item.count : ""}
              </button>
            );
          })}
        </div>
      </div>

      {people.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600/40 to-pink-600/40 ring-1 ring-pink-400/30">
            <Users size={28} className="text-pink-200" />
          </div>
          <p className="text-[16px] font-semibold text-white">{emptyCopy.title}</p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/45">
            {emptyCopy.body}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {people.map((person) => {
            if (person.id === currentUserId) return null;
            const isFollowing = followingIds.has(person.id);
            const flag = countryToFlag(person.country);
            return (
              <article
                key={person.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_24px_rgba(76,29,149,0.18)]"
                data-testid={`people-card-${person.id}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#1a0828]">
                  {hasOwnPhoto && isPhotoSrc(person.photo) ? (
                    <img src={person.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(160deg, #e879f9 0%, #a855f7 40%, #ec4899 78%, #6d28d9 100%)",
                      }}
                    >
                      <span className="text-[42px] font-bold tracking-wide text-white drop-shadow-[0_2px_12px_rgba(88,28,135,0.55)]">
                        {neonInitial(person.name)}
                      </span>
                    </div>
                  )}
                  {online[person.id] ? (
                    <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_#1a0828]" />
                  ) : null}
                </div>
                <div className="px-3 pb-3 pt-2.5">
                  <p className="truncate text-[15px] font-bold text-white">
                    {person.name}
                    {person.age ? (
                      <span className="font-semibold text-white/80">, {person.age}</span>
                    ) : null}
                    {flag ? <span className="ml-1 font-normal">{flag}</span> : null}
                  </p>
                  <div className="mt-2.5 flex gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === person.id}
                      onClick={() => onToggleFollow(person)}
                      className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
                        isFollowing
                          ? "border border-white/15 bg-white/[0.06] text-white/80"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.32)]"
                      }`}
                      data-testid={`follow-btn-${person.id}`}
                    >
                      <UserPlus size={13} />
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat(toChatTarget(person, online[person.id]))}
                      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-pink-400/25 bg-pink-500/15 text-[12px] font-semibold text-pink-100 transition active:scale-[0.98]"
                      data-testid={`message-btn-${person.id}`}
                    >
                      <MessageCircle size={13} />
                      Message
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
