"use client";
import type { ComponentType } from "react";
import { Video, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export type AppTab = "discover" | "lounge" | "history" | "messages";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

type TabIcon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

function LoungeArmchairIcon({ size = 20, className }: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden className={className}>
      <path
        d="M7 10.2V8.6A3.4 3.4 0 0 1 10.4 5.2h3.2A3.4 3.4 0 0 1 17 8.6v1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M5 13.2a2.3 2.3 0 0 1 2.3 2.3v.8h9.4v-.8a2.3 2.3 0 0 1 2.3-2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7.2 16.4v2.6M16.8 16.4v2.6M8.4 19.4h7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.2 12.2h7.6" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function HistoryClockIcon({ size = 20, className }: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden className={className}>
      <path d="M4.2 12a7.8 7.8 0 1 0 2.1-5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 5.6v3.4h3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.4V12l2.4 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage();
  const tabs: { id: AppTab; label: string; icon: TabIcon }[] = [
    { id: "discover", label: t("nav.discover"), icon: Video },
    { id: "lounge", label: t("nav.lounge"), icon: LoungeArmchairIcon },
    { id: "history", label: t("nav.history"), icon: HistoryClockIcon },
    { id: "messages", label: t("nav.messages"), icon: MessageCircle },
  ];

  return (
    <div className="yn-chrome fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-14 max-w-lg w-full items-center justify-around px-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors active:scale-95",
                active ? "text-[#ff4ec8]" : "text-[#8b8098]"
              )}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.15 : 1.75}
                className={active ? "drop-shadow-[0_0_8px_rgba(255,78,200,0.85)]" : undefined}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active && "text-[#ff4ec8] drop-shadow-[0_0_6px_rgba(255,78,200,0.55)]"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
