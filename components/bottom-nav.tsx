"use client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  YouNeonNavCameraIcon,
  YouNeonNavChatIcon,
  YouNeonNavClockIcon,
  YouNeonNavSofaIcon,
} from "@/components/icons/youneon-nav-icons";

export type AppTab = "discover" | "lounge" | "history" | "messages";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TAB_ICONS: Record<AppTab, typeof YouNeonNavCameraIcon> = {
  discover: YouNeonNavCameraIcon,
  lounge: YouNeonNavSofaIcon,
  history: YouNeonNavClockIcon,
  messages: YouNeonNavChatIcon,
};

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage();
  const tabs: { id: AppTab; label: string }[] = [
    { id: "discover", label: t("nav.discover") },
    { id: "lounge", label: t("nav.lounge") },
    { id: "history", label: t("nav.history") },
    { id: "messages", label: t("nav.messages") },
  ];

  return (
    <div className="yn-chrome yn-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom)]">
      <nav className="yn-bottom-nav-inner mx-auto flex max-w-lg w-full items-center justify-around px-1" aria-label="Main">
        {tabs.map(({ id, label }) => {
          const active = activeTab === id;
          const Icon = TAB_ICONS[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn("yn-nav-slot", active && "is-on")}
              aria-current={active ? "page" : undefined}
            >
              <span className="yn-nav-icon">
                <Icon size={30} className="yn-nav-svg" />
              </span>
              <span className="yn-nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
