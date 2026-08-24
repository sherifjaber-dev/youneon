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
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-6 pb-24">
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-black">Messages</h1>
          <button className="p-2 hover:bg-zinc-800 rounded-xl transition">
            <Users size={24} className="text-purple-400" />
          </button>
        </div>

        {!hasOwnPhoto && (
          <div className="mb-4 bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-purple-500/40 rounded-2xl p-3 flex items-center gap-3" data-testid="messages-photo-gate">
            <div className="w-10 h-10 rounded-full bg-purple-700/50 flex items-center justify-center flex-shrink-0">
              <Camera size={18} className="text-white" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Tilføj dit profilbillede</p>
              <p className="text-xs text-white/70">Du skal uploade dit eget billede for at se andres profilbilleder</p>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 pl-11 py-3 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
            data-testid="messages-search-input"
          />
        </div>
      </div>

      <div className="px-5">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm font-semibold text-zinc-400">Messages</span>
          <span className="text-xs text-purple-400">{filtered.length} conversations</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={64} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-400">No conversations yet</p>
            <p className="text-zinc-500 text-sm mt-2">
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
                  className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-purple-500/60 rounded-2xl cursor-pointer transition-all active:scale-[0.985]"
                  data-testid={`conversation-${otherId}`}
                >
                  {/* Round profile circle */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-md border-2 border-purple-400/30 flex-shrink-0">
                    {showPhoto ? (
                      <img src={photo} alt={name} className="w-full h-full object-cover" data-testid={`avatar-photo-${otherId}`} />
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
                      <span className="text-xs text-zinc-500">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-zinc-400 truncate pr-4">
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
