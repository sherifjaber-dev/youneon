"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Send, Smile, ImageIcon, Video, Lock, Diamond } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  subscribeToMessages,
  sendChatMessage,
  markConversationAsRead,
  subscribeToConversation,
  unlockConversation,
  cleanupOldReadMessages,
  getCallCost,
  recordCall,
  PAID_CALL_COST,
  ChatMessage,
} from "@/lib/firestore-service";

const UNLOCK_COST = 100;

interface ChatScreenProps {
  conversationId: string;
  currentUserId: string;
  hasOwnPhoto?: boolean;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    photo?: string;
    countryFlag?: string;
    isOnline?: boolean;
  };
  onBack: () => void;
  onCall: () => void;
  neonBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onOpenNeonShop?: () => void;
}

export function ChatScreen({
  conversationId,
  currentUserId,
  hasOwnPhoto = false,
  otherUser,
  onBack,
  onCall,
  neonBalance,
  onUpdateBalance,
  onOpenNeonShop,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [conv, setConv] = useState<any | null>(null);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showNoReplyToast, setShowNoReplyToast] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live conversation document (so unlock state is realtime)
  useEffect(() => {
    const unsub = subscribeToConversation(conversationId, setConv);
    return () => unsub();
  }, [conversationId]);

  // Cleanup old (read >48h ago) messages on open
  useEffect(() => {
    cleanupOldReadMessages(conversationId);
  }, [conversationId]);

  // Messages
  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      markConversationAsRead(conversationId, currentUserId).catch(() => {});
    });
    return () => unsub();
  }, [conversationId, currentUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isUnlocked = !!conv?.unlocked;
  // Other user has replied if there exists at least one message from otherUser.id
  const otherHasReplied = useMemo(
    () => messages.some((m) => m.senderId === otherUser.id),
    [messages, otherUser.id]
  );
  const missingNeon = Math.max(0, UNLOCK_COST - neonBalance);
  const callCost = useMemo(() => getCallCost(conv, currentUserId), [conv, currentUserId]);
  // Can other's profile picture be shown? Only if I uploaded my own photo.
  const canSeeOtherPhoto = hasOwnPhoto && !!otherUser.photo;

  const handleUnlock = async () => {
    if (unlocking) return;
    if (neonBalance < UNLOCK_COST) {
      setShowInsufficientModal(true);
      return;
    }
    setUnlocking(true);
    try {
      await unlockConversation(conversationId, currentUserId);
      onUpdateBalance(neonBalance - UNLOCK_COST);
    } catch (e) {
      console.error(e);
      alert("Kunne ikke låse chatten op. Prøv igen.");
    }
    setUnlocking(false);
  };

  const handleSend = async () => {
    if (!isUnlocked) { setShowInsufficientModal(neonBalance < UNLOCK_COST); return; }
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setShowEmoji(false);
    setSending(true);
    try {
      await sendChatMessage(conversationId, currentUserId, text);
    } catch (e) {
      console.error(e);
      alert("Could not send message");
    }
    setSending(false);
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((p) => p + emojiData.emoji);
  };

  const compressImage = (file: File, maxW = 800, quality = 0.7): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxW) {
            height = (height * maxW) / width;
            width = maxW;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isUnlocked) { setShowInsufficientModal(neonBalance < UNLOCK_COST); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Image too large (max 8 MB)");
      return;
    }
    setSending(true);
    try {
      const compressed = await compressImage(file);
      await sendChatMessage(conversationId, currentUserId, "", compressed);
    } catch (err) {
      console.error(err);
      alert("Could not send image");
    }
    setSending(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleVideoCall = async () => {
    if (!isUnlocked) { setShowInsufficientModal(neonBalance < UNLOCK_COST); return; }
    if (!otherHasReplied) {
      setShowNoReplyToast(true);
      setTimeout(() => setShowNoReplyToast(false), 3000);
      return;
    }
    if (callCost > 0 && neonBalance < callCost) {
      setShowInsufficientModal(true);
      return;
    }
    if (callCost > 0) {
      onUpdateBalance(neonBalance - callCost);
    }
    try { await recordCall(conversationId, currentUserId); } catch (e) { /* silent */ }
    onCall();
  };

  const callDisabled = !isUnlocked || !otherHasReplied;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-purple-950 flex flex-col">
      <div className="sticky top-0 z-40 flex items-center gap-3 p-4 bg-purple-950/95 backdrop-blur-lg border-b border-purple-500/30">
        <button onClick={onBack} className="p-2 hover:bg-purple-800/50 rounded-full" data-testid="chat-back-btn">
          <ArrowLeft className="text-white" size={22} />
        </button>
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl overflow-hidden border-2 border-white/10">
            {canSeeOtherPhoto ? (
              <img src={otherUser.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{otherUser.avatar}</span>
            )}
          </div>
          {otherUser.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-purple-950"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-white truncate">{otherUser.name}</p>
            {otherUser.countryFlag && <span>{otherUser.countryFlag}</span>}
          </div>
          <p className="text-xs text-purple-300/70">
            {otherUser.isOnline ? "Online" : "Offline"}
          </p>
        </div>
        <button
          onClick={handleVideoCall}
          disabled={callDisabled}
          className={`relative p-3 rounded-full transition-all ${
            callDisabled
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/40"
          }`}
          title={!isUnlocked ? "Unlock chat first" : !otherHasReplied ? "Wait for a reply first" : (callCost > 0 ? `Video call: ${callCost} Neon` : "Free video call")}
          data-testid="chat-video-call-btn"
        >
          <Video size={20} />
          {callDisabled ? (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-700 rounded-full flex items-center justify-center border border-zinc-900">
              <Lock size={9} className="text-zinc-300" />
            </span>
          ) : callCost > 0 ? (
            <span className="absolute -top-2 -right-2 text-[9px] font-black bg-yellow-400 text-black px-1.5 py-0.5 rounded-full border border-yellow-600 leading-none">
              ◆{callCost}
            </span>
          ) : (
            <span className="absolute -top-2 -right-2 text-[9px] font-black bg-emerald-400 text-black px-1.5 py-0.5 rounded-full border border-emerald-600 leading-none">
              FREE
            </span>
          )}
        </button>
      </div>

      {/* ===== LOCKED PAYWALL OVERLAY ===== */}
      {!isUnlocked && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#16101f] border border-white/10 rounded-2xl p-5 text-center" data-testid="chat-locked-paywall">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-3">
              <Lock className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Chat is locked</h2>
            <p className="text-white/55 text-sm mb-4">
              Unlock chat with <b className="text-yellow-300">{otherUser.name}</b> to send messages, photos, and video calls.
            </p>

            <div className="bg-black/30 rounded-xl p-3 mb-4 border border-white/8">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Diamond className="text-yellow-400" size={18} fill="currentColor" />
                <span className="text-xl font-semibold text-yellow-300">{UNLOCK_COST}</span>
                <span className="text-white/60 text-sm font-medium">Neon</span>
              </div>
              <p className="text-[11px] text-white/45">One-time unlock — then unlimited</p>
            </div>

            <ul className="text-left text-sm text-white/70 space-y-1.5 mb-4">
              <li>Unlimited messages</li>
              <li>Share photos</li>
              <li>Video calls (after they reply)</li>
            </ul>

            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[15px] font-semibold shadow-[0_4px_14px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all disabled:opacity-60"
              data-testid="unlock-chat-btn"
            >
              {unlocking ? "Unlocking..." : `Unlock for ${UNLOCK_COST} Neon`}
            </button>

            <p className="text-xs text-white/40 mt-3">
              Your balance: <span className="text-yellow-300 font-semibold">◆ {neonBalance}</span> Neon
            </p>
          </div>
        </div>
      )}

      {/* ===== MESSAGES (only when unlocked) ===== */}
      {isUnlocked && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
            {!hasOwnPhoto && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3 text-center text-purple-200 text-xs" data-testid="photo-gate-banner">
                Add your own profile photo to see {otherUser.name}’s picture
              </div>
            )}
            {!otherHasReplied && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 text-center text-yellow-200 text-xs" data-testid="awaiting-reply-banner">
                Wait for {otherUser.name} to reply — then you can start a video call
              </div>
            )}
            {otherHasReplied && callCost > 0 && (
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-3 text-center text-pink-200 text-xs" data-testid="call-cost-banner">
                Next video call costs {callCost} Neon · free again in 24h
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-purple-300/60">
                <p className="text-lg font-semibold">Start the conversation!</p>
                <p className="text-sm">Send a message to {otherUser.name}</p>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-white shadow ${
                        mine
                          ? "bg-gradient-to-br from-purple-500 to-pink-500"
                          : "bg-purple-900/50 border border-purple-500/30"
                      }`}
                    >
                      {msg.imageBase64 && (
                        <img
                          src={msg.imageBase64}
                          alt=""
                          className="rounded-lg max-w-full mb-1"
                        />
                      )}
                      {msg.text && <p className="break-words whitespace-pre-wrap">{msg.text}</p>}
                      <p className="text-[10px] text-white/60 mt-1 text-right">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {showEmoji && (
            <div className="fixed bottom-20 left-2 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} height={350} width={300} />
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 p-3 bg-purple-950/95 backdrop-blur-lg border-t border-purple-500/30 flex items-center gap-2">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className="p-2 text-purple-300 hover:text-white"
              data-testid="chat-emoji-btn"
            >
              <Smile size={22} />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2 text-purple-300 hover:text-white"
              data-testid="chat-image-btn"
            >
              <ImageIcon size={22} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-purple-900/40 border border-purple-500/30 rounded-full px-4 py-2 text-white placeholder:text-purple-300/50 focus:outline-none focus:border-purple-400"
              data-testid="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
              data-testid="chat-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}

      {/* ===== "No reply yet" toast for video call ===== */}
      {showNoReplyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-yellow-500/50 rounded-2xl px-5 py-3 shadow-2xl text-white text-sm max-w-xs text-center" data-testid="no-reply-toast">
          You can start a video call after {otherUser.name} replies to your message
        </div>
      )}

      {/* ===== INSUFFICIENT NEON MODAL ===== */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowInsufficientModal(false)}>
          <div className="bg-[#16101f] rounded-2xl p-5 max-w-sm w-full border border-white/10 text-white" onClick={(e) => e.stopPropagation()} data-testid="chat-insufficient-modal">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/15 border border-yellow-400/40 mb-3">
                <span className="text-xl">◆</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">Not enough Neon</h3>
              <div className="bg-black/30 rounded-xl p-3 mb-3 border border-white/8">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/50">Unlock chat</span>
                  <span className="font-semibold text-yellow-300">◆ {UNLOCK_COST} Neon</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/50">You have</span>
                  <span className="font-semibold text-white">◆ {neonBalance} Neon</span>
                </div>
                <div className="border-t border-white/8 my-2"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70 font-medium">Missing</span>
                  <span className="font-semibold text-pink-400">◆ {missingNeon} Neon</span>
                </div>
              </div>
              <p className="text-white/55 text-sm">
                Add Neon to unlock this chat.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="flex-1 h-11 rounded-xl border border-white/12 text-white/80 text-[15px] font-semibold hover:bg-white/6 transition"
                data-testid="chat-cancel-insufficient-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowInsufficientModal(false);
                  if (onOpenNeonShop) {
                    onOpenNeonShop();
                  } else {
                    alert("Neon Shop is not available yet.");
                  }
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[15px] font-semibold"
                data-testid="chat-buy-neon-btn"
              >
                ◆ Buy Neon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
