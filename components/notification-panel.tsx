"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Megaphone, Newspaper, Sparkles, X } from "lucide-react";
import type { Announcement, AnnouncementType } from "@/lib/announcements";

const TYPE_META: Record<
  AnnouncementType,
  { label: string; icon: typeof Bell; className: string }
> = {
  system: { label: "System", icon: Bell, className: "text-sky-300 bg-sky-400/10" },
  news: { label: "News", icon: Newspaper, className: "text-violet-300 bg-violet-400/10" },
  promo: { label: "Promo", icon: Sparkles, className: "text-pink-300 bg-pink-400/10" },
  ad: { label: "Offer", icon: Megaphone, className: "text-amber-300 bg-amber-400/10" },
};

type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
  announcements: Announcement[];
};

export function NotificationPanel({ open, onClose, announcements }: NotificationPanelProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  const items = useMemo(
    () => announcements.filter((item) => item.active),
    [announcements]
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[70]" aria-hidden={!open}>
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Close notifications"
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[min(100%,360px)] flex-col border-l border-white/10 bg-[#12061c]/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Notifications"
        onTransitionEnd={() => {
          if (!open) setVisible(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5 pt-[calc(env(safe-area-inset-top)+12px)]">
          <div>
            <p className="text-[15px] font-semibold text-white">Notifications</p>
            <p className="text-[11px] text-white/45">System updates, news, and offers</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {items.length === 0 ? (
            <div className="mt-10 text-center text-sm text-white/40">No announcements yet.</div>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-white/8 bg-white/[0.04] p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
                        <Icon size={10} />
                        {meta.label}
                      </span>
                      {item.createdAtMs > 0 && (
                        <span className="text-[10px] text-white/35">
                          {new Date(item.createdAtMs).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/60">{item.body}</p>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="mt-2 max-h-28 w-full rounded-lg object-cover"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
