"use client";
import { Flame, MessageCircle, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export type AppTab = "discover" | "lounge" | "history" | "messages";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage();
  const tabs: { id: AppTab; label: string; icon: typeof Flame }[] = [
    { id: "discover", label: t("nav.discover"), icon: Flame },
    { id: "lounge", label: t("nav.lounge"), icon: Users },
    { id: "history", label: t("nav.history"), icon: Clock },
    { id: "messages", label: t("nav.messages"), icon: MessageCircle },
  ];

  return (
    <div className="yn-glass fixed bottom-0 left-0 right-0 z-50 border-t border-black/6 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-14 max-w-lg w-full items-center justify-around px-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors active:scale-95",
                active ? "text-yn-text" : "text-yn-muted"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-yn-accent-2" : undefined} />
              <span className={cn("text-[10px] font-medium leading-none", active && "text-yn-accent")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
