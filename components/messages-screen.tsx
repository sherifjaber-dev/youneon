"use client";
import { useState, useEffect } from "react";
import { MessageCircle, Users, Search, Camera } from "lucide-react";
import { subscribeToConversations } from "@/lib/firestore-service";

interface MessagesScreenProps {
  currentUserId?: string;
  hasOwnPhoto?: boolean;
  onOpenChat?: (user: {
    id: string;
    name: string;
    avatar: string;
    photo?: string;
    countryFlag?: string;
    isOnline?: boolean;
  }) => void;
}

export function MessagesScreen({ currentUserId, hasOwnPhoto = false, onOpenChat }: MessagesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToConversations(currentUserId, setConversations);
    return () => unsub();
  }, [currentUserId]);

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const filtered = conversations.filter((c) => {
    if (!currentUserId) return false;
    const otherId = c.participants?.find((p: string) => p !== currentUserId);
    const name = c.participantNames?.[otherId] || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleClick = (conv: any) => {
    if (!currentUserId) return;
    const otherId = conv.participants?.find((p: string) => p !== currentUserId);
    if (!otherId) return;
    onOpenChat?.({
      id: otherId,
      name: conv.participantNames?.[otherId] || "User",
      avatar: conv.participantAvatars?.[otherId] || "🙂",
      photo: conv.participantPhotos?.[otherId] || "",
      countryFlag: conv.participantFlags?.[otherId] || "",
      isOnline: false,
    });
  };

  return (
    <div className="min-h-full bg-[#0f0117] pb-4 text-white">
      <div className="mb-4 px-4 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
          <button className="rounded-lg p-1.5 text-purple-300 transition hover:bg-white/6">
            <Users size={18} />
          </button>
        </div>

        {!hasOwnPhoto && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-purple-500/25 bg-purple-900/25 p-3" data-testid="messages-photo-gate">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-700/50">
              <Camera size={16} className="text-white" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-white">Add your profile photo</p>
              <p className="text-[12px] text-white/55">Upload a photo to see others’ profile pictures</p>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 text-[15px] text-white placeholder:text-white/35 focus:border-purple-500/50 focus:outline-none"
            data-testid="messages-search-input"
          />
        </div>
      </div>

      <div className="px-4">
        <div className="mb-3 flex items-center justify-between px-0.5">
          <span className="text-[12px] font-medium text-white/45">Inbox</span>
          <span className="text-[12px] text-purple-300/80">{filtered.length} conversations</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle size={36} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/55">No conversations yet</p>
            <p className="mt-1.5 text-sm text-white/35">
              Go to History and tap the message icon to start chatting
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => {
              const otherId = conv.participants?.find((p: string) => p !== currentUserId);
              const name = conv.participantNames?.[otherId] || "User";
              const avatar = conv.participantAvatars?.[otherId] || "🙂";
              const photo = conv.participantPhotos?.[otherId] || "";
              const flag = conv.participantFlags?.[otherId] || "";
              const unread = conv.unreadCount?.[currentUserId || ""] || 0;
              const showPhoto = hasOwnPhoto && !!photo;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleClick(conv)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition-all hover:border-purple-500/40 active:scale-[0.99]"
                  data-testid={`conversation-${otherId}`}
                >
                  <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg">
                    {showPhoto ? (
                      <img src={photo} alt={name} className="h-full w-full object-cover" data-testid={`avatar-photo-${otherId}`} />
                    ) : (
                      <span data-testid={`avatar-emoji-${otherId}`}>{avatar}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white" data-testid={`conversation-name-${otherId}`}>{name}</span>
                        {flag && <span className="text-lg">{flag}</span>}
                      </div>
                      <span className="text-xs text-white/35">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-white/45 truncate pr-4">
                        {conv.lastMessage || "Start the conversation..."}
                      </p>
                      {unread > 0 && (
                        <div className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center">
                          {unread}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
