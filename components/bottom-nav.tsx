"use client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export type AppTab = "discover" | "lounge" | "history" | "messages";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TAB_ICONS: Record<AppTab, string> = {
  discover: "/youneon/camera.png",
  lounge: "/youneon/nav-sofa.png",
  history: "/youneon/nav-clock.png",
  messages: "/youneon/nav-chat.png",
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
    <div className="yn-chrome fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-14 max-w-lg w-full items-center justify-around px-1">
        {tabs.map(({ id, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "yn-nav-slot flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors active:scale-95",
                active ? "is-on" : "text-[#8b8098]"
              )}
            >
              <span className="yn-nav-icon">
                <img
                  src={TAB_ICONS[id]}
                  alt=""
                  draggable={false}
                  className="yn-nav-img"
                />
              </span>
              <span
                className={cn(
                  "yn-nav-label text-[10px] font-medium leading-none",
                  !active && "text-[#8b8098]"
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
