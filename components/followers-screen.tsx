"use client";

import { useState } from "react";
import { ArrowLeft, MessageCircle, UserPlus, Users } from "lucide-react";
import { UserPhoto } from "@/components/neon-avatar";
import { CountryLabel } from "@/components/country-flag";
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
  onOpenProfile?: (userId: string) => void;
}

function toChatTarget(person: FollowPerson, online?: boolean): ChatTarget {
  return {
    id: person.id,
    name: person.name,
    avatar: person.name,
    photo: person.photo,
    country: person.country,
    countryFlag: person.country,
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
  onOpenProfile,
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
    <div className="min-h-full bg-yn-bg pb-6 text-yn-text">
      <div className="sticky top-0 z-10 yn-glass border-b border-black/6 px-2 pt-1">
        <div className="flex h-12 items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-yn-muted transition active:scale-95"
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
                    : "border border-black/8 bg-yn-card text-yn-muted"
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 to-pink-100 ring-1 ring-pink-200">
            <Users size={28} className="text-yn-accent" />
          </div>
          <p className="text-[16px] font-semibold text-yn-text">{emptyCopy.title}</p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-yn-muted">
            {emptyCopy.body}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {people.map((person) => {
            if (person.id === currentUserId) return null;
            const isFollowing = followingIds.has(person.id);
            return (
              <article
                key={person.id}
                className="overflow-hidden rounded-2xl border border-black/6 bg-yn-card shadow-[0_8px_24px_rgba(88,28,135,0.08)]"
                data-testid={`people-card-${person.id}`}
              >
                <button
                  type="button"
                  className="relative aspect-[4/5] w-full overflow-hidden bg-yn-nav"
                  onClick={() => onOpenProfile?.(person.id)}
                  aria-label={`View ${person.name}'s profile`}
                >
                  <UserPhoto
                    src={person.photo}
                    alt=""
                    showPhoto={hasOwnPhoto}
                    className="h-full w-full object-cover"
                  />
                  {online[person.id] ? (
                    <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_var(--yn-card)]" />
                  ) : null}
                </button>
                <div className="px-3 pb-3 pt-2.5">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onOpenProfile?.(person.id)}
                  >
                    <span className="block truncate text-[15px] font-bold text-yn-text">
                      {person.name}
                      {person.age ? (
                        <span className="font-semibold text-yn-muted">, {person.age}</span>
                      ) : null}
                    </span>
                    {person.country ? (
                      <CountryLabel
                        country={person.country}
                        size={16}
                        className="mt-0.5 text-[12px] font-medium text-yn-muted"
                      />
                    ) : null}
                  </button>
                  <div className="mt-2.5 flex gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === person.id}
                      onClick={() => onToggleFollow(person)}
                      className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
                        isFollowing
                          ? "border border-black/10 bg-yn-bg text-yn-muted"
                          : "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_4px_12px_rgba(192,38,211,0.22)]"
                      }`}
                      data-testid={`follow-btn-${person.id}`}
                    >
                      <UserPlus size={13} />
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat(toChatTarget(person, online[person.id]))}
                      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-pink-200 bg-pink-50 text-[12px] font-semibold text-pink-700 transition active:scale-[0.98]"
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
