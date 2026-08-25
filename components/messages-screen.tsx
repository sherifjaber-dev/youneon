"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronRight, MessageCircle, UserPlus } from "lucide-react";
import { subscribeToConversations } from "@/lib/firestore-service";
import { NeonAvatar } from "@/components/neon-avatar";
import { FollowersScreen, type ChatTarget } from "@/components/followers-screen";
import { useFollowGraph } from "@/hooks/use-follow-graph";
import { useBlockedIds } from "@/hooks/use-user-settings";
import { countryToFlag } from "@/lib/countries";
import { ProfilePreviewSheet } from "@/components/call-remote-profile";

interface MessagesScreenProps {
  currentUserId?: string;
  hasOwnPhoto?: boolean;
  currentUser?: FollowSnapshot;
  onOpenChat?: (user: ChatTarget) => void;
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
      countryFlag: user.countryFlag || countryToFlag(user.country),
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

  const previewSheet = (
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
      <>
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
          onOpenProfile={(id) => setPreviewUserId(id)}
        />
        {previewSheet}
      </>
    );
  }

  return (
    <div className="min-h-full bg-yn-bg pb-6 text-yn-text">
      <div className="px-4 pt-3">
        <h1 className="text-[32px] font-bold leading-none tracking-tight">Message</h1>
      </div>

      {!hasOwnPhoto && (
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3" data-testid="messages-photo-gate">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600">
            <Camera size={16} className="text-white" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-yn-text">Add your profile photo</p>
            <p className="text-[12px] text-yn-muted">Upload a photo to see others’ profile pictures</p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setPeopleView("following")}
          className="flex h-11 items-center gap-0.5 px-4 text-[13px] font-medium text-yn-muted"
          data-testid="follow-section-link"
        >
          Follow
          <ChevronRight size={14} />
        </button>

        <div
          className="mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
          data-testid="follow-strip"
        >
          {!ready ? (
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex w-[128px] shrink-0 flex-col items-center rounded-2xl border border-black/6 bg-yn-card px-2.5 pb-3 pt-3 shadow-sm"
              >
                <div className="h-20 w-20 animate-pulse rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/25" />
                <div                 className="mt-3 h-3 w-16 animate-pulse rounded-full bg-black/8" />
                <div className="mt-3 h-11 w-full animate-pulse rounded-full bg-black/6" />
              </div>
            ))
          ) : following.length === 0 ? (
            <div
              className="flex min-h-[196px] w-full min-w-[280px] flex-col items-center justify-center rounded-2xl border border-fuchsia-200 bg-gradient-to-b from-fuchsia-50 via-yn-card to-pink-50 px-5 py-6 text-center shadow-[0_8px_28px_rgba(88,28,135,0.08)]"
              data-testid="follow-strip-empty"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-[0_8px_20px_rgba(192,38,211,0.22)]">
                <UserPlus size={22} className="text-white" />
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
                className="flex w-[128px] shrink-0 flex-col items-center rounded-2xl border border-black/6 bg-yn-card px-2.5 pb-3 pt-3 shadow-sm"
                data-testid={`follow-card-${person.id}`}
              >
                <button
                  type="button"
                  className="flex w-full flex-col items-center"
                  onClick={() => setPreviewUserId(person.id)}
                  aria-label={`View ${person.name}'s profile`}
                >
                  <NeonAvatar
                    src={person.photo}
                    name={person.name}
                    size={80}
                    showPhoto={hasOwnPhoto}
                    online={!!online[person.id]}
                  />
                  <p className="mt-2.5 w-full truncate text-center text-[13px] font-bold text-yn-text">
                    {person.name}
                  </p>
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
                      countryFlag: countryToFlag(person.country),
                      isOnline: !!online[person.id],
                    })
                  }
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-yn-bg text-[12px] font-semibold text-yn-muted transition active:scale-[0.98]"
                >
                  Message
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 px-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-yn-muted">Messages</p>

        <button
          type="button"
          onClick={() => setPeopleView("followers")}
          className="mt-3 flex min-h-[72px] w-full items-center gap-3 py-3 text-left"
          data-testid="see-my-followers"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/90 to-fuchsia-500/90 shadow-[0_4px_14px_rgba(168,85,247,0.35)]">
            <UserPlus size={22} className="text-white" />
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
                  <div className="rounded-full ring-2 ring-yn-bg">
                    <NeonAvatar
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

        {conversations.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 to-pink-100 ring-1 ring-pink-200">
              <MessageCircle size={26} className="text-yn-accent" />
            </div>
            <p className="text-[15px] font-semibold text-yn-text">No conversations yet</p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-yn-muted">
              After a video chat, tap Message in History to start a real thread.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/6">
            {conversations.map((conv) => {
              const otherId = conv.participants?.find((p: string) => p !== currentUserId);
              if (!otherId || blockedIds.has(otherId)) return null;
              const known = peopleById[otherId];
              const name = conv.participantNames?.[otherId] || known?.name || "User";
              const photo = conv.participantPhotos?.[otherId] || known?.photo || "";
              const flag = countryToFlag(
                conv.participantFlags?.[otherId] || known?.country || ""
              );
              const unread = conv.unreadCount?.[currentUserId || ""] || 0;
              return (
                <div
                  key={conv.id}
                  className="flex min-h-[76px] w-full items-start gap-3 py-3.5"
                  data-testid={`conversation-${otherId}`}
                >
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => setPreviewUserId(otherId)}
                    aria-label={`View ${name}'s profile`}
                  >
                    <NeonAvatar
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
                        className="flex min-w-0 items-center gap-1.5 truncate text-left text-[16px] font-bold text-yn-text"
                        onClick={() => setPreviewUserId(otherId)}
                      >
                        <span className="truncate" data-testid={`conversation-name-${otherId}`}>
                          {name}
                        </span>
                        {flag ? <span className="shrink-0 text-[15px]">{flag}</span> : null}
                      </button>
                      <button
                        type="button"
                        className="shrink-0 pt-0.5 text-[11px] text-yn-muted"
                        onClick={() =>
                          openChat({
                            id: otherId,
                            name,
                            avatar: name,
                            photo,
                            countryFlag: flag,
                            isOnline: !!online[otherId],
                          })
                        }
                      >
                        {formatConvDate(conv.lastMessageTime)}
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
                          countryFlag: flag,
                          isOnline: !!online[otherId],
                        })
                      }
                      className="mt-1 flex w-full items-center justify-between gap-3 text-left transition active:opacity-80"
                    >
                      <p className="truncate text-[13px] text-yn-muted">
                        {conv.lastMessage || "Start the conversation..."}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
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
