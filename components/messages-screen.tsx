"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronRight, MessageCircle, UserPlus } from "lucide-react";
import { subscribeToConversations } from "@/lib/firestore-service";
import { NeonAvatar } from "@/components/neon-avatar";
import { FollowersScreen, type ChatTarget } from "@/components/followers-screen";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { useBlockedIds } from "@/hooks/use-user-settings";
import { CountryFlag } from "@/components/country-flag";
import { ProfilePreviewSheet } from "@/components/call-remote-profile";
import type { FollowSnapshot } from "@/lib/follow-service";
import { isHiddenSocialPeer } from "@/lib/real-pi-user";

interface MessagesScreenProps {
  currentUserId?: string;
  hasOwnPhoto?: boolean;
  currentUser?: FollowSnapshot;
  onOpenChat?: (user: ChatTarget) => void;
  onOpenProfile?: (userId: string) => void;
}

type PeopleView = "inbox" | "followers" | "following";

function formatConvDate(ts: unknown) {
  if (!ts) return "";
  const d =
    typeof ts === "object" && ts !== null && "toDate" in ts
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as string | number | Date);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return `${dd}/${mm}/${yyyy}`;
}

export function MessagesScreen({
  currentUserId,
  hasOwnPhoto = false,
  currentUser,
  onOpenChat,
  onOpenProfile,
}: MessagesScreenProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [peopleView, setPeopleView] = useState<PeopleView>("inbox");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const me: FollowSnapshot = {
    id: currentUser?.id || currentUserId || "",
    name: currentUser?.name,
    photo: currentUser?.photo,
    avatar: currentUser?.avatar,
    country: currentUser?.country,
    age: currentUser?.age,
  };
  const graphUserId = me.id || currentUserId;
  const { following, followers, followingIds, online, busyId, ready, toggleFollow } =
    useFollowGraph(graphUserId);
  const blockedIds = useBlockedIds(graphUserId);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToConversations(currentUserId, setConversations);
    return () => unsub();
  }, [currentUserId]);

  const handleToggleFollow = (person: { id: string; name: string; photo: string; country: string; age?: number }) => {
    if (!me.id) return;
    toggleFollow(me, person);
  };

  const openChat = (user: ChatTarget) => {
    onOpenChat?.({
      ...user,
      countryFlag: user.countryFlag || user.country,
    });
  };

  const recentFollowerAvatars = useMemo(() => followers.slice(0, 3), [followers]);
  const peopleById = useMemo(() => {
    const map: Record<string, (typeof following)[number]> = {};
    [...following, ...followers].forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [following, followers]);

  const visibleConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const otherId = conv.participants?.find((p: string) => p !== currentUserId);
      if (!otherId || blockedIds.has(otherId)) return false;
      const known = peopleById[otherId];
      const name = conv.participantNames?.[otherId] || known?.name || "";
      return !isHiddenSocialPeer(otherId, name);
    });
  }, [conversations, currentUserId, blockedIds, peopleById]);

  const openProfile = (id: string) => {
    if (onOpenProfile) {
      onOpenProfile(id);
      return;
    }
    setPreviewUserId(id);
  };

  const previewSheet = onOpenProfile ? null : (
    <ProfilePreviewSheet
      open={!!previewUserId}
      onClose={() => setPreviewUserId(null)}
      userId={previewUserId || undefined}
      viewerId={graphUserId}
      standalone
      onMessage={(user) => {
        setPreviewUserId(null);
        openChat(user);
      }}
    />
  );

  if (peopleView !== "inbox") {
    return (
      <div className="yn-messages">
        <FollowersScreen
          key={peopleView}
          initialTab={peopleView}
          currentUserId={currentUserId || ""}
          hasOwnPhoto={hasOwnPhoto}
          followers={followers}
          following={following}
          followingIds={followingIds}
          online={online}
          busyId={busyId}
          onBack={() => setPeopleView("inbox")}
          onToggleFollow={handleToggleFollow}
          onOpenChat={openChat}
          onOpenProfile={(id) => openProfile(id)}
        />
        {previewSheet}
      </div>
    );
  }

  return (
    <div className="yn-messages">
      <div className="yn-messages-heading">
        <span className="yn-messages-heading-line" />
        <h1>MESSAGES</h1>
        <span className="yn-messages-heading-line" />
      </div>

      {!hasOwnPhoto && (
        <div className="yn-messages-gate" data-testid="messages-photo-gate">
          <div className="yn-messages-gate-icon">
            <Camera size={16} />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-yn-text">Add your profile photo</p>
            <p className="text-[12px] text-yn-muted">Upload a photo to see others’ profile pictures</p>
          </div>
        </div>
      )}

      <div className="yn-messages-follow">
        <button
          type="button"
          onClick={() => setPeopleView("following")}
          className="yn-messages-follow-link"
          data-testid="follow-section-link"
        >
          Follow
          <ChevronRight size={14} />
        </button>

        <div
          className="yn-messages-strip"
          style={{ WebkitOverflowScrolling: "touch" }}
          data-testid="follow-strip"
        >
          {!ready ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="yn-messages-person">
                <div className="yn-messages-skeleton animate-pulse" />
                <div className="mt-2 h-3 w-12 animate-pulse rounded-full bg-white/10" />
                <div className="mt-2 h-3 w-10 animate-pulse rounded-full bg-white/8" />
              </div>
            ))
          ) : following.length === 0 ? (
            <div className="yn-messages-empty-follow" data-testid="follow-strip-empty">
              <div className="yn-messages-followers-icon mb-3">
                <UserPlus size={22} />
              </div>
              <p className="text-[15px] font-semibold text-yn-text">No one here yet</p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-yn-muted">
                Follow people from History and they appear here instantly — with a photo, name, and Message.
              </p>
            </div>
          ) : (
            following.map((person) => (
              <div
                key={person.id}
                className="yn-messages-person"
                data-testid={`follow-card-${person.id}`}
              >
                <button
                  type="button"
                  className="flex w-full flex-col items-center"
                  onClick={() => openProfile(person.id)}
                  aria-label={`View ${person.name}'s profile`}
                >
                  <NeonAvatar
                    className="yn-messages-ring"
                    src={person.photo}
                    name={person.name}
                    size={64}
                    showPhoto={hasOwnPhoto}
                    online={!!online[person.id]}
                  />
                  <p className="yn-messages-person-name">{person.name}</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openChat({
                      id: person.id,
                      name: person.name,
                      avatar: person.name,
                      photo: person.photo,
                      country: person.country,
                      countryFlag: person.country,
                      isOnline: !!online[person.id],
                    })
                  }
                  className="yn-messages-person-msg"
                >
                  Message
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="yn-messages-section">
        <p className="yn-messages-section-label">Messages</p>

        <button
          type="button"
          onClick={() => setPeopleView("followers")}
          className="yn-messages-followers"
          data-testid="see-my-followers"
        >
          <div className="yn-messages-followers-icon">
            <UserPlus size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center text-[16px] font-bold text-yn-text">
              See My Followers
              <ChevronRight size={16} className="ml-0.5 text-yn-muted" />
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-yn-muted">
              See who just followed you. Start a chat!
            </p>
          </div>
          {recentFollowerAvatars.length > 0 && (
            <div className="flex shrink-0 pr-1">
              {recentFollowerAvatars.map((person, i) => (
                <div
                  key={person.id}
                  className="relative"
                  style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i }}
                >
                  <div className="rounded-full ring-2 ring-[#07040f]">
                    <NeonAvatar
                      className="yn-messages-ring"
                      src={person.photo}
                      name={person.name}
                      size={28}
                      showPhoto={hasOwnPhoto}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>

        {visibleConversations.length === 0 ? (
          <div className="yn-messages-empty">
            <div className="yn-messages-empty-icon">
              <MessageCircle size={26} />
            </div>
            <p className="text-[15px] font-semibold text-yn-text">No conversations yet</p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-yn-muted">
              After a video chat, tap Message in History to start a real thread.
            </p>
          </div>
        ) : (
          <div className="yn-messages-list">
            {visibleConversations.map((conv) => {
              const otherId = conv.participants?.find((p: string) => p !== currentUserId);
              if (!otherId || blockedIds.has(otherId)) return null;
              const known = peopleById[otherId];
              const name = conv.participantNames?.[otherId] || known?.name || "User";
              if (isHiddenSocialPeer(otherId, name)) return null;
              const photo = conv.participantPhotos?.[otherId] || known?.photo || "";
              const country = conv.participantFlags?.[otherId] || known?.country || "";
              const unread = conv.unreadCount?.[currentUserId || ""] || 0;
              return (
                <div
                  key={conv.id}
                  className="yn-messages-row"
                  data-testid={`conversation-${otherId}`}
                >
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => openProfile(otherId)}
                    aria-label={`View ${name}'s profile`}
                  >
                    <NeonAvatar
                      className="yn-messages-ring"
                      src={photo}
                      name={name}
                      size={64}
                      showPhoto={hasOwnPhoto}
                      online={!!online[otherId]}
                    />
                  </button>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="flex min-w-0 items-center text-left"
                        onClick={() => openProfile(otherId)}
                      >
                        <span className="yn-messages-name" data-testid={`conversation-name-${otherId}`}>
                          <span className="truncate">{name}</span>
                          {country ? (
                            <CountryFlag
                              country={country}
                              size={14}
                              className="shadow-none ring-1 ring-white/20"
                            />
                          ) : null}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="flex shrink-0 items-center gap-2 pt-0.5"
                        onClick={() =>
                          openChat({
                            id: otherId,
                            name,
                            avatar: name,
                            photo,
                            country,
                            countryFlag: country,
                            isOnline: !!online[otherId],
                          })
                        }
                      >
                        <span className="yn-messages-time">{formatConvDate(conv.lastMessageTime)}</span>
                        {unread > 0 && <span className="yn-messages-unread">{unread}</span>}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openChat({
                          id: otherId,
                          name,
                          avatar: name,
                          photo,
                          country,
                          countryFlag: country,
                          isOnline: !!online[otherId],
                        })
                      }
                      className="mt-1 flex w-full items-center text-left transition active:opacity-80"
                    >
                      <p className="yn-messages-preview">
                        {conv.lastMessage || "Start the conversation..."}
                      </p>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {previewSheet}
    </div>
  );
}
