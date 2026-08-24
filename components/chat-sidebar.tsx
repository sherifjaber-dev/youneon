"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Image as ImageIcon, Video, Check, CheckCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  sender: "local" | "remote";
  text?: string;
  image?: string;
  timestamp: Date;
  expiresAt: Date;
  read: boolean;
}

interface ChatSidebarProps {
  remoteName: string;
  onClose: () => void;
}

const VIDEO_CALL_COST = 100;
const MESSAGE_EXPIRY_HOURS = 24;

export function ChatSidebar({ remoteName, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "remote",
      text: `Hey! Nice to meet you! 👋`,
      timestamp: new Date(Date.now() - 30000),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      read: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [neonBalance, setNeonBalance] = useState(100);
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [lastFreeCallDate, setLastFreeCallDate] = useState<string | null>(null);
  const [isVideoCallPaid, setIsVideoCallPaid] = useState(false);
  const [otherPersonReplied, setOtherPersonReplied] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Neon balance
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        const balance = localStorage.getItem("youneon_neon_balance");
        if (balance) {
          setNeonBalance(parseInt(balance));
        }
        
        const lastCall = localStorage.getItem(`youneon_last_call_${remoteName}`);
        if (lastCall) {
          setLastFreeCallDate(lastCall);
        }
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
    scrollToBottom();
  }, []);

  useEffect(() => {
    // Auto-delete expired messages
    const interval = setInterval(() => {
      setMessages(prev => {
        const now = new Date();
        return prev.filter(msg => msg.expiresAt > now);
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if other person has sent any messages
    const hasRemoteMessage = messages.some(msg => msg.sender === "remote");
    setOtherPersonReplied(hasRemoteMessage);
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "local",
      text: inputText,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + MESSAGE_EXPIRY_HOURS * 60 * 60 * 1000),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate read receipt after 1 second
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, read: true } : msg
        )
      );
    }, 1000);

    // Simulate a response after 2 seconds
    setTimeout(() => {
      const responses = [
        "That's cool! 😊",
        "Tell me more! 🤔",
        "I agree! 💯",
        "Haha, funny! 😂",
        "Nice! 🎉",
        "How are you? 😄",
      ];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "remote",
          text: randomResponse,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + MESSAGE_EXPIRY_HOURS * 60 * 60 * 1000),
          read: true,
        },
      ]);
    }, 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "local",
        image: imageData,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + MESSAGE_EXPIRY_HOURS * 60 * 60 * 1000),
        read: false,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simulate read receipt
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, read: true } : msg
          )
        );
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const isCallFree = () => {
    if (!lastFreeCallDate) return true;
    
    const lastCall = new Date(lastFreeCallDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastCall.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  };

  const handleVideoCall = () => {
    if (!otherPersonReplied) {
      return;
    }
    
    const callIsFree = isCallFree();
    
    if (!callIsFree && neonBalance < VIDEO_CALL_COST) {
      alert("Not enough Neon for this video call. Please buy more.");
      return;
    }

    if (!callIsFree) {
      setShowVideoConfirm(true);
      setIsVideoCallPaid(true);
    } else {
      startVideoCall();
    }
  };

  const confirmVideoCall = () => {
    if (neonBalance < VIDEO_CALL_COST) {
      alert("Not enough Neon. Please buy more.");
      setShowVideoConfirm(false);
      return;
    }

    // Deduct Neon
    const newBalance = neonBalance - VIDEO_CALL_COST;
    setNeonBalance(newBalance);
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        localStorage.setItem("youneon_neon_balance", newBalance.toString());
      }
    } catch (e) {
      console.error("Error saving balance:", e);
    }

    setShowVideoConfirm(false);
    startVideoCall();
  };

  const startVideoCall = () => {
    const now = new Date();
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        localStorage.setItem(`youneon_last_call_${remoteName}`, now.toISOString());
      }
    } catch (e) {
      console.error("Error saving call time:", e);
    }
    setLastFreeCallDate(now.toISOString());

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate a response after 1 second
    setTimeout(() => {
      const responses = [
        "That's cool! 😊",
        "Tell me more! 🤔",
        "I agree! 💯",
        "Haha, funny! 😂",
        "Nice! 🎉",
        "How are you? 😄",
      ];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "remote",
          text: randomResponse,
          timestamp: new Date(),
        },
      ]);
    }, 1000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gradient-to-b from-background to-background/95 border-l border-border shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
        <h3 className="font-semibold text-lg">Chat with {remoteName}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-background rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "local" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs ${
                msg.sender === "local"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-br-none"
                  : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-none"
              }`}
            >
              {msg.image && (
                <img src={msg.image} alt="shared" className="w-full h-auto rounded-xl max-h-60 object-cover" />
              )}
              {msg.text && (
                <p className="px-4 py-2 text-sm">{msg.text}</p>
              )}
              <div className="px-4 py-1 flex items-center justify-between gap-2">
                <p className="text-xs opacity-70">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {msg.sender === "local" && (
                  <div>
                    {msg.read ? (
                      <CheckCheck size={14} className="text-green-300" />
                    ) : (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3">
        <div className="flex gap-2">
          {/* Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/40 transition-all hover:scale-110 active:scale-95"
          >
            <ImageIcon size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Message Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full p-2 transition shadow-lg shadow-purple-500/40"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>

          {/* Video Call Button */}
          <button
            onClick={handleVideoCall}
            disabled={!otherPersonReplied}
            className={`p-2 rounded-full transition-all ${
              otherPersonReplied
                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/40 hover:scale-110 active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={!otherPersonReplied ? "Waiting for their reply to start video call" : "Start video call"}
          >
            <Video size={20} />
          </button>
        </div>

        {/* Call Cost Info */}
        {!isCallFree() && (
          <div className="px-3 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg flex items-center gap-2 text-sm">
            <Zap size={16} fill="currentColor" className="text-yellow-600" />
            <span className="font-semibold text-yellow-700">Next call: {VIDEO_CALL_COST} Neon</span>
          </div>
        )}

        {isCallFree() && (
          <div className="px-3 py-2 bg-green-100 border-2 border-green-400 rounded-lg text-center text-sm font-semibold text-green-700">
            First call with this person (24h): FREE
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Messages and photos delete after 24 hours 🔄
        </p>
      </div>

      {/* Video Call Confirmation Dialog */}
      {showVideoConfirm && isVideoCallPaid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl px-6 py-8 shadow-2xl max-w-sm w-full space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                <Video size={32} className="text-cyan-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Start Video Call?</h2>
              <p className="text-gray-600 text-sm">You already had a free call with {remoteName} in the last 24 hours.</p>
            </div>

            <div className="px-4 py-3 bg-red-100 border-2 border-red-400 rounded-lg flex items-center justify-center gap-2">
              <Zap size={20} fill="currentColor" className="text-yellow-500" />
              <span className="font-bold text-red-700">This video call costs {VIDEO_CALL_COST} Neon</span>
            </div>

            <div className="px-4 py-2 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Your balance: <span className="font-bold text-gray-900">{neonBalance} Neon</span></p>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmVideoCall}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/40"
              >
                Continue & Pay
              </button>
              <button
                onClick={() => setShowVideoConfirm(false)}
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
