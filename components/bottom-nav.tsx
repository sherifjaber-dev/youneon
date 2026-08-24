"use client";
import { Flame, MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: "discover" | "messages" | "history";
  onTabChange: (tab: "discover" | "messages" | "history") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "discover", label: "Discover", icon: Flame },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "history", label: "History", icon: Clock },
  ];

  return (
    <div className="yn-glass fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-14 max-w-lg w-full items-center justify-around px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id as "discover" | "messages" | "history")}
              className={cn(
                "flex min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors active:scale-95",
                active ? "text-white" : "text-white/45"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-pink-400" : undefined} />
              <span className={cn("text-[10px] font-medium leading-none", active && "text-pink-300")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
