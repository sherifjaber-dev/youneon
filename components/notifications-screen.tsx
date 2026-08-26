"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronLeft,
  Crown,
  Gift,
  Megaphone,
  MessageCircle,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { Announcement } from "@/lib/announcements";
import {
  inboxActionFor,
  relativeShort,
  type InboxFilter,
  type InboxItem,
  type NotificationAction,
} from "@/lib/notifications";
import { SUBSCRIPTION_PLAN } from "@/lib/product-config";
import { UserPhoto } from "@/components/neon-avatar";

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "notifications", label: "Notifications" },
  { id: "events", label: "Events & Promotions" },
  { id: "updates", label: "Updates" },
];

type NotificationsScreenProps = {
  open: boolean;
  onClose: () => void;
  announcements: Announcement[];
  items: InboxItem[];
  markAllRead: () => void;
  isPremium?: boolean;
  premiumUntil?: string | null;
  onOpenShop?: () => void;
  onOpenChat?: (user: { id: string; name: string; avatar: string; photo?: string }) => void;
  onOpenMessages?: () => void;
};

function ItemIcon({ item }: { item: InboxItem }) {
  const wrap =
    item.kind === "gift"
      ? "from-amber-400 to-pink-500"
      : item.kind === "follow"
        ? "from-fuchsia-500 to-purple-600"
        : item.kind === "message"
          ? "from-sky-400 to-violet-500"
          : item.kind === "promo" || item.kind === "event"
            ? "from-pink-500 to-purple-600"
            : "from-violet-500 to-indigo-600";
  const Icon =
    item.kind === "gift"
      ? Gift
      : item.kind === "follow"
        ? UserPlus
        : item.kind === "message"
          ? MessageCircle
          : item.kind === "promo"
            ? Crown
            : item.kind === "event"
              ? Sparkles
              : item.kind === "system"
                ? Bell
                : Megaphone;
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${wrap} text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]`}
    >
      {item.giftEmoji ? (
        <span className="text-lg leading-none">{item.giftEmoji}</span>
      ) : (
        <Icon size={18} strokeWidth={2.2} />
      )}
    </span>
  );
}

function FeedAvatar({ item }: { item: InboxItem }) {
  if (item.kind !== "follow" && item.kind !== "message" && item.kind !== "gift") return null;
  if (!item.actorName && !item.actorPhoto) return null;
  return (
    <div className="mt-3">
      <UserPhoto
        src={item.actorPhoto}
        alt=""
        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/15"
      />
    </div>
  );
}

export function NotificationsScreen({
  open,
  onClose,
  announcements,
  items,
  markAllRead,
  isPremium = false,
  onOpenShop,
  onOpenChat,
  onOpenMessages,
}: NotificationsScreenProps) {
  const [visible, setVisible] = useState(open);
  const [filter, setFilter] = useState<InboxFilter>("all");

  useEffect(() => {
    if (!open) return;
    setVisible(true);
    setFilter("all");
  }, [open]);

  useEffect(() => {
    if (open) markAllRead();
  }, [open, items, markAllRead]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const promoAnnouncement = useMemo(
    () => announcements.find((item) => item.active && (item.type === "promo" || item.type === "ad")),
    [announcements]
  );

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.filter === filter)),
    [items, filter]
  );

  const handleAction = (action: NotificationAction | null) => {
    if (!action) return;
    if (action.type === "chat") {
      onClose();
      onOpenChat?.(action.user);
      return;
    }
    if (action.type === "followers" || action.type === "messages") {
      onClose();
      onOpenMessages?.();
      return;
    }
    if (action.type === "shop") {
      onClose();
      onOpenShop?.();
    }
  };

  const openShop = () => {
    onClose();
    onOpenShop?.();
  };

  if (!visible) return null;

  const banner = promoAnnouncement
    ? {
        eyebrow: promoAnnouncement.type === "ad" ? "Promotion" : "YouNeon Event",
        title: promoAnnouncement.title,
        body: promoAnnouncement.body,
        cta: isPremium ? "See more" : "Subscribe",
        imageUrl: promoAnnouncement.imageUrl,
      }
    : {
        eyebrow: isPremium ? "YouNeon Premium" : "Subscribe",
        title: isPremium
          ? "You're Premium. Unlimited chats, filters, and the full glow."
          : "Unlock YouNeon Premium. Unlimited chats, free filters, and 1,000 Neon.",
        body: isPremium
          ? "Keep the glow on — renew anytime with Pi."
          : `${SUBSCRIPTION_PLAN.amount} π for ${SUBSCRIPTION_PLAN.days} days. Ad-free matching and a Premium badge.`,
        cta: isPremium ? "Renew" : "Subscribe",
        imageUrl: undefined as string | undefined,
      };

  const emptyCopy =
    filter === "notifications"
      ? { title: "No notifications yet", body: "Follows, messages, and gifts will show up here." }
      : filter === "events"
        ? { title: "No events right now", body: "Campaigns and Premium offers will land in this tab." }
        : filter === "updates"
          ? { title: "No updates yet", body: "System messages from YouNeon appear here." }
          : { title: "You're all caught up", body: "When someone follows you, sends a gift, or messages you, it will show here." };

  return (
    <div className="fixed inset-0 z-[70]" aria-hidden={!open}>
      <div
        className={`flex h-full flex-col bg-yn-bg text-yn-text transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        onTransitionEnd={() => {
          if (!open) setVisible(false);
        }}
      >
        <section className="relative overflow-hidden bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#db2777] px-3 pb-5 pt-[calc(env(safe-area-inset-top)+6px)]">
          <div className="pointer-events-none absolute -right-8 top-6 h-40 w-40 rounded-full bg-pink-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-violet-300/20 blur-2xl" />
          <div className="relative flex items-start gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white/95 active:scale-95"
              aria-label="Back"
            >
              <ChevronLeft size={28} strokeWidth={2.2} />
            </button>
            <div className="min-w-0 flex-1 pt-1.5 pr-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                {banner.eyebrow}
              </p>
              <h1 className="mt-1 text-[20px] font-bold leading-snug tracking-tight">{banner.title}</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">{banner.body}</p>
              <button
                type="button"
                onClick={openShop}
                className="mt-4 inline-flex h-11 min-w-[132px] items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-[#5b21b6] shadow-[0_8px_24px_rgba(15,1,23,0.25)] active:scale-[0.98]"
              >
                {banner.cta} ›
              </button>
            </div>
            <div className="relative mt-2 w-[92px] shrink-0 sm:w-[108px]">
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt=""
                  className="h-[112px] w-full rounded-2xl object-cover shadow-lg ring-2 ring-white/20"
                />
              ) : (
                <div className="flex h-[112px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/12 p-3 shadow-lg backdrop-blur-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-pink-500 shadow-[0_0_16px_rgba(236,72,153,0.55)]">
                    <Crown size={20} className="text-white" />
                  </span>
                  <p className="mt-2 text-center text-[10px] font-semibold leading-tight text-white/90">
                    Premium
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="yn-glass sticky top-0 z-10 border-b border-black/6">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`h-11 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors active:scale-[0.98] ${
                    active
                      ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_4px_14px_rgba(192,38,211,0.22)]"
                      : "bg-yn-card text-yn-muted shadow-sm"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-2">
          {(filter === "all" || filter === "events") && (
            <button
              type="button"
              onClick={openShop}
              className="mb-2 mt-3 flex w-full items-center gap-3 rounded-2xl border border-pink-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-4 text-left active:scale-[0.99]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Crown size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">
                  {isPremium ? "YouNeon Premium" : "Subscribe to YouNeon Premium"}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-yn-muted">
                  {isPremium
                    ? "Unlimited chats, free filters, and ad-free browsing are on."
                    : (
                      <>
                        <span className="text-[16px] font-bold text-yn-gold">{SUBSCRIPTION_PLAN.amount} π</span>
                        {" / "}{SUBSCRIPTION_PLAN.days} days · 1,000 Neon on subscribe.
                      </>
                    )}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4AF37] px-3.5 py-2 text-[13px] font-bold text-[#1a1408] shadow-[0_2px_8px_rgba(201,162,39,0.35)]">
                {isPremium ? "Renew" : "Subscribe"}
              </span>
            </button>
          )}

          {filtered.length === 0 && filter !== "all" && filter !== "events" ? (
            <div className="mt-10 px-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-yn-card text-yn-accent shadow-sm">
                <Bell size={22} />
              </div>
              <p className="mt-4 text-[16px] font-semibold">{emptyCopy.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-yn-muted">{emptyCopy.body}</p>
              {!isPremium && (
                <button
                  type="button"
                  onClick={openShop}
                  className="yn-gold-cta mx-auto mt-5 inline-flex min-w-[200px] items-center justify-center px-5 text-[#1a1408]"
                >
                  Subscribe with Pi
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y-0">
              {filtered.map((item) => (
                <li key={item.id} className="py-5">
                  <button
                    type="button"
                    onClick={() => handleAction(inboxActionFor(item))}
                    className="flex min-h-12 w-full items-start gap-3 text-left active:opacity-80"
                  >
                    <ItemIcon item={item} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-yn-text">
                          {item.title}
                        </p>
                        <span className="shrink-0 pt-0.5 text-[12px] font-medium text-yn-muted">
                          {relativeShort(item.createdAtMs)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-yn-muted">{item.body}</p>
                      <FeedAvatar item={item} />
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="mt-3 max-h-40 w-full rounded-2xl object-cover ring-1 ring-white/10"
                        />
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
