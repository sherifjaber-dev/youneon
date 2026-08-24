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
    <div className="min-h-full bg-[#0f0117] pb-4">
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-white">History</h1>
        <p className="mt-0.5 text-[13px] text-white/45">Your recent video chats</p>
      </div>

      <div className="mt-2 space-y-2 px-4">
        {history.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-white/55">No video chats yet</p>
            <p className="mt-1.5 text-sm text-white/35">Start a random chat from Discover</p>
          </div>
        ) : (
          history.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xl">
                  {u.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-white">{u.name}</p>
                    <span className="text-sm">{u.countryFlag}</span>
                    <OnlineBadge isOnline={online[u.matchId] || false} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-white/40">
                    <span>{formatTime(u.timestamp)}</span>
                    <span>•</span>
                    <span>{u.duration}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white" aria-label="Like"><Heart size={15} /></button>
                <button onClick={() => setConfirmUser(u)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white" aria-label="Message"><MessageSquare size={15} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16101f] p-5">
            <h3 className="mb-2 text-center text-lg font-semibold text-white">Start chat with {confirmUser.name}?</h3>
            <p className="mb-5 text-center text-sm text-white/55">Cost: <span className="font-semibold text-yellow-300">{MESSAGE_COST} Neon</span></p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmUser(null)} className="h-11 flex-1 rounded-xl border border-white/12 text-[15px] font-semibold text-white/80">Cancel</button>
              <button onClick={confirmChat} className="h-11 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white">Confirm</button>
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