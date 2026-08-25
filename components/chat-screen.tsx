"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Send, Smile, ImageIcon, Video, Lock, Diamond } from "lucide-react";
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

import { ProfilePreviewSheet } from "@/components/call-remote-profile";
import { PremiumBadge } from "@/components/premium-badge";
import { NeonAvatar } from "@/components/neon-avatar";
import { CountryLabel } from "@/components/country-flag";
import {
  ChatSmileyText,
  YouNeonSmileyPicker,
  smileyToken,
  type SmileyId,
} from "@/components/icons/youneon-smileys";

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
    country?: string;
    isOnline?: boolean;
  };
  onBack: () => void;
  onCall: () => void;
  neonBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onOpenNeonShop?: () => void;
  isPremium?: boolean;
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
  isPremium = false,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [conv, setConv] = useState<any | null>(null);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showNoReplyToast, setShowNoReplyToast] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  const isUnlocked = conv == null || !!conv.unlocked;
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
      alert("Could not unlock chat. Please try again.");
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

  const handleSmiley = (id: SmileyId) => {
    const token = smileyToken(id);
    setInput((prev) => {
      if (!prev) return token;
      return prev.endsWith(" ") ? prev + token : `${prev} ${token}`;
    });
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
    <div className="yn-chat min-h-screen flex flex-col">
      <div className="yn-chat-header sticky top-0 z-40 flex items-center gap-3 px-3 py-2.5">
        <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full" data-testid="chat-back-btn">
          <ArrowLeft className="text-zinc-800" size={22} />
        </button>
        <button
          type="button"
          className="relative"
          onClick={() => setPreviewOpen(true)}
          aria-label={`View ${otherUser.name}'s profile`}
        >
          <NeonAvatar
            src={otherUser.photo}
            name={otherUser.name}
            size={44}
            showPhoto={canSeeOtherPhoto}
            online={!!otherUser.isOnline}
          />
        </button>
        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => setPreviewOpen(true)}
        >
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-[17px] text-zinc-900 truncate">{otherUser.name}</p>
            {isPremium && <PremiumBadge />}
          </div>
          <CountryLabel
            country={otherUser.country || otherUser.countryFlag}
            size={16}
            className="text-[12px] text-zinc-500"
          />
          <p className={`text-xs ${otherUser.isOnline ? "text-pink-500" : "text-zinc-400"}`}>
            {otherUser.isOnline ? "Online" : "Offline"}
          </p>
        </button>
        <button
          onClick={handleVideoCall}
          disabled={callDisabled}
          className={`relative p-3 rounded-full transition-all ${
            callDisabled
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : "yn-chat-accent-btn text-white hover:shadow-lg hover:shadow-pink-500/30"
          }`}
          title={!isUnlocked ? "Unlock chat first" : !otherHasReplied ? "Wait for a reply first" : (callCost > 0 ? `Video call: ${callCost} Neon` : "Free video call")}
          data-testid="chat-video-call-btn"
        >
          <Video size={20} />
          {callDisabled ? (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-200 rounded-full flex items-center justify-center border border-white">
              <Lock size={9} className="text-zinc-500" />
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
          <div className="yn-chat-card max-w-sm w-full rounded-2xl p-5 text-center" data-testid="chat-locked-paywall">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full yn-chat-accent-btn mb-3">
              <Lock className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Chat is locked</h2>
            <p className="text-zinc-500 text-sm mb-4">
              Unlock chat with <b className="text-zinc-800">{otherUser.name}</b> to send messages, photos, and video calls.
            </p>

            <div className="bg-zinc-50 rounded-xl p-3 mb-4 border border-zinc-100">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Diamond className="text-yellow-500" size={18} fill="currentColor" />
                <span className="text-xl font-semibold text-zinc-900">{UNLOCK_COST}</span>
                <span className="text-zinc-500 text-sm font-medium">Neon</span>
              </div>
              <p className="text-[11px] text-zinc-400">One-time unlock — then unlimited</p>
            </div>

            <ul className="text-left text-sm text-zinc-600 space-y-1.5 mb-4">
              <li>Unlimited messages</li>
              <li>Share photos</li>
              <li>Video calls (after they reply)</li>
            </ul>

            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="w-full h-11 rounded-xl yn-chat-accent-btn text-white text-[15px] font-semibold active:scale-[0.98] transition-all disabled:opacity-60"
              data-testid="unlock-chat-btn"
            >
              {unlocking ? "Unlocking..." : `Unlock for ${UNLOCK_COST} Neon`}
            </button>

            <p className="text-xs text-zinc-400 mt-3">
              Your balance: <span className="text-zinc-800 font-semibold">◆ {neonBalance}</span> Neon
            </p>
          </div>
        </div>
      )}

      {/* ===== MESSAGES (only when unlocked) ===== */}
      {isUnlocked && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3.5 pb-28">
            {!hasOwnPhoto && (
              <div className="yn-chat-banner yn-chat-banner-info rounded-2xl p-3 text-center text-xs" data-testid="photo-gate-banner">
                Add your own profile photo to see {otherUser.name}’s picture
              </div>
            )}
            {!otherHasReplied && (
              <div className="yn-chat-banner yn-chat-banner-wait rounded-2xl p-3 text-center text-xs" data-testid="awaiting-reply-banner">
                Wait for {otherUser.name} to reply — then you can start a video call
              </div>
            )}
            {otherHasReplied && callCost > 0 && (
              <div className="yn-chat-banner yn-chat-banner-call rounded-2xl p-3 text-center text-xs" data-testid="call-cost-banner">
                Next video call costs {callCost} Neon · free again in 24h
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-400">
                <p className="text-lg font-semibold text-zinc-600">Start the conversation!</p>
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
                      className={`max-w-[78%] px-4 py-2.5 text-[16px] leading-[1.4] shadow-sm ${
                        mine
                          ? "yn-chat-bubble-out rounded-[22px] rounded-br-md"
                          : "yn-chat-bubble-in rounded-[22px] rounded-bl-md"
                      }`}
                    >
                      {msg.imageBase64 && (
                        <img
                          src={msg.imageBase64}
                          alt=""
                          className="rounded-xl max-w-full mb-1.5"
                        />
                      )}
                      {msg.text && <ChatSmileyText text={msg.text} />}
                      <p className={`text-[11px] mt-1 text-right ${mine ? "text-white/70" : "text-zinc-400"}`}>
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
            <>
              <button
                type="button"
                className="yn-smiley-scrim"
                aria-label="Close smileys"
                onClick={() => setShowEmoji(false)}
              />
              <YouNeonSmileyPicker onSelect={handleSmiley} />
            </>
          )}

          <div className="yn-chat-composer fixed bottom-0 left-0 right-0 px-3 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] flex items-center gap-2 z-40">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className={`p-2 rounded-full ${showEmoji ? "text-pink-500 bg-pink-50" : "text-zinc-400 hover:text-pink-500"}`}
              data-testid="chat-emoji-btn"
            >
              <Smile size={22} />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-pink-500 rounded-full"
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
              className="yn-chat-field flex-1 rounded-full px-4 py-[11px] text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-400/40"
              data-testid="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-3 rounded-full yn-chat-accent-btn text-white disabled:opacity-40"
              data-testid="chat-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}

      {/* ===== "No reply yet" toast for video call ===== */}
      {showNoReplyToast && (
        <div className="yn-chat-card fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 text-zinc-800 text-sm max-w-xs text-center" data-testid="no-reply-toast">
          You can start a video call after {otherUser.name} replies to your message
        </div>
      )}

      {/* ===== INSUFFICIENT NEON MODAL ===== */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowInsufficientModal(false)}>
          <div className="yn-chat-card rounded-2xl p-5 max-w-sm w-full text-zinc-900" onClick={(e) => e.stopPropagation()} data-testid="chat-insufficient-modal">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-50 border border-yellow-200 mb-3">
                <span className="text-xl">◆</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">Not enough Neon</h3>
              <div className="bg-zinc-50 rounded-xl p-3 mb-3 border border-zinc-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">Unlock chat</span>
                  <span className="font-semibold text-zinc-900">◆ {UNLOCK_COST} Neon</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">You have</span>
                  <span className="font-semibold text-zinc-900">◆ {neonBalance} Neon</span>
                </div>
                <div className="border-t border-zinc-100 my-2"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 font-medium">Missing</span>
                  <span className="font-semibold text-pink-500">◆ {missingNeon} Neon</span>
                </div>
              </div>
              <p className="text-zinc-500 text-sm">
                Add Neon to unlock this chat.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="flex-1 h-11 rounded-xl border border-zinc-200 text-zinc-600 text-[15px] font-semibold hover:bg-zinc-50 transition"
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
                className="flex-1 h-11 rounded-xl yn-chat-accent-btn text-white text-[15px] font-semibold"
                data-testid="chat-buy-neon-btn"
              >
                ◆ Buy Neon
              </button>
            </div>
          </div>
        </div>
      )}
      <ProfilePreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        userId={otherUser.id}
        viewerId={currentUserId}
        hint={{
          userId: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.photo,
          country: otherUser.country,
          countryFlag: otherUser.countryFlag,
        }}
        standalone
      />
    </div>
  );
}
