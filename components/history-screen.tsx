"use client";
import { useState, useEffect } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { OnlineBadge } from "@/components/online-badge";
import { subscribeToHistory } from "@/lib/firestore-service";

interface HistoryScreenProps {
  currentUserId?: string;
  onOpenChat?: (user: { id: string; name: string; avatar: string; countryFlag?: string; isOnline?: boolean }) => void;
}

const MESSAGE_COST = 50;

export function HistoryScreen({ currentUserId, onOpenChat }: HistoryScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [neonBalance, setNeonBalance] = useState(100);
  const [confirmUser, setConfirmUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState(false);
  const [online, setOnline] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const bal = localStorage.getItem("youneon_neon_balance");
    if (bal) setNeonBalance(parseInt(bal));
    if (!currentUserId) return;
    const unsub = subscribeToHistory(currentUserId, (items) => {
      setHistory(items);
      const s: Record<string, boolean> = {};
      items.forEach((u) => (s[u.matchId] = Math.random() > 0.4));
      setOnline(s);
    });
    return () => unsub();
  }, [currentUserId]);

  const formatTime = (ts: any) => {
    if (!ts) return "Just now";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const confirmChat = () => {
    if (!confirmUser) return;
    if (neonBalance < MESSAGE_COST) {
      setErrorMsg(true);
      setConfirmUser(null);
      setTimeout(() => setErrorMsg(false), 3000);
      return;
    }
    const newBal = neonBalance - MESSAGE_COST;
    setNeonBalance(newBal);
    localStorage.setItem("youneon_neon_balance", newBal.toString());
    const u = confirmUser;
    setConfirmUser(null);
    onOpenChat?.({
      id: u.matchId,
      name: u.name,
      avatar: u.avatar,
      countryFlag: u.countryFlag,
      isOnline: online[u.matchId] || false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-purple-950 pt-24 pb-24">
      <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-950/95 to-purple-950/80 border-b border-purple-500/30 px-4 py-6 backdrop-blur-lg">
        <h1 className="text-4xl font-black text-white">History</h1>
        <p className="text-purple-300/70 text-sm mt-1">Your recent video chats</p>
      </div>

      <div className="px-4 space-y-3 mt-4">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-purple-300/70 text-lg">No video chats yet</p>
            <p className="text-purple-400/50 text-sm mt-2">Start a random chat from Discover</p>
          </div>
        ) : (
          history.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 p-4 rounded-lg bg-purple-900/20 border border-purple-500/30 hover:border-purple-400/60">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-md">
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">{u.name}</p>
                    <span className="text-xl">{u.countryFlag}</span>
                    <OnlineBadge isOnline={online[u.matchId] || false} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-400/60 mt-1">
                    <span>{formatTime(u.timestamp)}</span>
                    <span>•</span>
                    <span>{u.duration}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Heart size={18} /></button>
                <button onClick={() => setConfirmUser(u)} className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white"><MessageSquare size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-3xl p-6 max-w-sm w-full border border-purple-500/50">
            <h3 className="text-xl font-bold text-center mb-4 text-white">Start chat with {confirmUser.name}?</h3>
            <p className="text-center text-purple-300 mb-6">Cost: <span className="font-bold text-yellow-300">{MESSAGE_COST} Neon</span></p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmUser(null)} className="flex-1 py-4 border border-purple-500/50 text-purple-300 rounded-2xl">Cancel</button>
              <button onClick={confirmChat} className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl z-50">
          Not enough Neon! Need {MESSAGE_COST}.
        </div>
      )}
    </div>
  );
}