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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-purple-950/95 to-purple-950/80 border-t border-purple-500/30 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-3 max-w-lg mx-auto w-full">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id as any)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95",
              activeTab === id
                ? "text-white bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-lg shadow-purple-500/50"
                : "text-purple-300 hover:text-pink-300"
            )}
          >
            <Icon size={20} className="mb-1" />
            <span className="text-xs font-medium mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
