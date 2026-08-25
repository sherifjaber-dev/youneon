"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Ban,
  ChevronRight,
  Copy,
  Crown,
  Globe,
  HelpCircle,
  Languages,
  LogOut,
  Package,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { SubscribeWithPi } from "@/components/subscribe-with-pi";
import { AnnouncementsAdmin } from "@/components/announcements-admin";
import { MyItemsInventory } from "@/components/my-items-inventory";
import { NeonAvatar } from "@/components/neon-avatar";
import { isCurrentUserAdmin } from "@/lib/admin";
import { useLanguage } from "@/contexts/language-context";
import { APP_LANGUAGES } from "@/lib/i18n";
import { piAuthService } from "@/lib/pi-auth-service";
import { isPremiumActive } from "@/lib/premium";
import { useUserSettings } from "@/hooks/use-user-settings";
import {
  cancelPremiumLocally,
  saveBackgroundPlay,
  saveHideGender,
  saveNotificationPrefs,
  savePrivacyConsent,
  unblockUserForMe,
  type NotificationPrefs,
  type PrivacyConsent,
} from "@/lib/user-settings";
import type { Announcement } from "@/lib/announcements";
import { SAFETY_TIPS_SECTIONS, COMMUNITY_GUIDELINES_SECTIONS } from "@/lib/safety-copy";

type PageId =
  | "menu"
  | "items"
  | "subscriptions"
  | "blocked"
  | "neonId"
  | "account"
  | "language"
  | "safety"
  | "guidelines"
  | "privacy"
  | "help";

const PAGE_TITLE: Record<PageId, string> = {
  menu: "settings.title",
  items: "settings.myItems",
  subscriptions: "settings.subscriptions",
  blocked: "settings.blockedUsers",
  neonId: "settings.neonId",
  account: "settings.manageAccount",
  language: "settings.appLanguage",
  safety: "settings.safetyTips",
  guidelines: "settings.guidelines",
  privacy: "settings.privacyChoices",
  help: "settings.help",
};

function NeonToggle({
  on,
  disabled,
  onChange,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        disabled
          ? "bg-black/15 opacity-70"
          : on
            ? "bg-gradient-to-r from-fuchsia-500 to-pink-500"
            : "bg-black/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-yn-muted">
        {title}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-black/6 bg-yn-card">{children}</div>
    </section>
  );
}

function RowButton({
  icon,
  label,
  value,
  onClick,
  danger,
  last,
}: {
  icon?: ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 w-full items-center gap-3 px-3.5 py-2.5 text-left ${
        last ? "" : "border-b border-black/6"
      }`}
    >
      {icon ? <span className="text-yn-accent">{icon}</span> : null}
      <span className={`flex-1 text-[15px] font-medium ${danger ? "text-red-600" : "text-yn-text"}`}>
        {label}
      </span>
      {value ? <span className="max-w-[46%] truncate text-[13px] text-yn-muted">{value}</span> : null}
      {onClick ? <ChevronRight size={18} className="shrink-0 text-yn-muted" /> : null}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  on,
  disabled,
  onChange,
  last,
}: {
  label: string;
  description?: string;
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <div className={`flex min-h-12 items-center gap-3 px-3.5 py-2.5 ${last ? "" : "border-b border-black/6"}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-yn-text">{label}</p>
        {description ? <p className="mt-0.5 text-[12px] leading-snug text-yn-muted">{description}</p> : null}
      </div>
      <NeonToggle on={on} disabled={disabled} onChange={onChange} label={label} />
    </div>
  );
}

export function ProfileSettingsSheet({
  open,
  onClose,
  neonBalance,
  isPremium,
  premiumUntil,
  announcements,
  currentUsername,
  onOpenShop,
}: {
  open: boolean;
  onClose: () => void;
  neonBalance: number;
  isPremium: boolean;
  premiumUntil: string | null;
  announcements: Announcement[];
  currentUsername?: string;
  onOpenShop?: () => void;
}) {
  const { language, setLanguage, t } = useLanguage();
  const username = currentUsername || piAuthService.getCurrentUser()?.username || "";
  const settings = useUserSettings(open ? username : undefined);
  const [page, setPage] = useState<PageId>("menu");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!open) {
      setPage("menu");
      setConfirmDelete(false);
    }
  }, [open]);

  if (!open) return null;

  const logout = () => {
    try {
      localStorage.removeItem("youneon_user_profile");
      localStorage.removeItem("youneon_authenticated");
    } catch {
      /* ignore */
    }
    piAuthService.logout();
    window.location.reload();
  };

  const deleteAccount = () => {
    try {
      localStorage.removeItem("youneon_user_profile");
      localStorage.removeItem("youneon_authenticated");
      localStorage.removeItem("youneon_neon_balance");
      localStorage.removeItem("youneon_reactions_received");
      localStorage.removeItem("youneon_reports");
      localStorage.removeItem("youneon_reported_users");
      localStorage.removeItem("youneon_blocked_users");
    } catch {
      /* ignore */
    }
    piAuthService.logout();
    window.location.reload();
  };

  const copyId = async () => {
    const id = settings.neonId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const patchNotif = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...settings.notificationPrefs, [key]: value };
    void saveNotificationPrefs(username, next);
  };

  const headerBack = page === "menu" ? onClose : () => setPage("menu");
  const headerIcon = page === "menu" ? <X size={20} /> : <ArrowLeft size={20} />;
  const headerLabel = page === "menu" ? t("common.close") : t("common.back");

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-yn-bg text-yn-text">
      <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-black/6 px-2 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={headerBack}
          className="flex h-11 w-11 items-center justify-center rounded-full text-yn-text hover:bg-black/5"
          aria-label={headerLabel}
        >
          {headerIcon}
        </button>
        <h2 className="text-[17px] font-semibold text-yn-text">{t(PAGE_TITLE[page])}</h2>
        <span className="w-11" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        {page === "menu" && (
          <>
            <Group title={t("settings.activity")}>
              <RowButton
                icon={<Zap size={18} />}
                label={t("settings.myNeon")}
                value={`${neonBalance} Neon`}
                onClick={() => {
                  onOpenShop?.();
                  onClose();
                }}
              />
              <RowButton
                icon={<Package size={18} />}
                label={t("settings.myItems")}
                onClick={() => setPage("items")}
              />
              <RowButton
                icon={<Crown size={18} />}
                label={t("settings.subscriptions")}
                value={isPremium ? t("settings.premiumActive") : undefined}
                onClick={() => setPage("subscriptions")}
              />
              <RowButton
                icon={<Ban size={18} />}
                label={t("settings.blockedUsers")}
                last
                onClick={() => setPage("blocked")}
              />
            </Group>

            <Group title={t("settings.account")}>
              <RowButton
                icon={<Sparkles size={18} />}
                label={t("settings.neonId")}
                value={settings.neonId || "…"}
                onClick={() => setPage("neonId")}
              />
              <RowButton
                icon={<UserRound size={18} />}
                label={t("settings.piUsername")}
                value={username || "—"}
              />
              <RowButton
                icon={<Trash2 size={18} />}
                label={t("settings.manageAccount")}
                last
                onClick={() => setPage("account")}
              />
            </Group>

            <Group title={t("settings.notifications")}>
              <ToggleRow
                label={t("settings.marketingNotifs")}
                on={settings.notificationPrefs.marketing}
                onChange={(v) => patchNotif("marketing", v)}
              />
              <ToggleRow
                label={t("settings.onlineStatusNotifs")}
                description={t("settings.onlineStatusNotifsDesc")}
                on={settings.notificationPrefs.onlineStatus}
                onChange={(v) => patchNotif("onlineStatus", v)}
              />
              <ToggleRow
                label={t("settings.newFollowersNotifs")}
                on={settings.notificationPrefs.newFollowers}
                onChange={(v) => patchNotif("newFollowers", v)}
                last
              />
            </Group>

            <Group title={t("settings.safety")}>
              <RowButton
                icon={<ShieldAlert size={18} />}
                label={t("settings.safetyTips")}
                onClick={() => setPage("safety")}
              />
              <RowButton
                icon={<Shield size={18} />}
                label={t("settings.guidelines")}
                last
                onClick={() => setPage("guidelines")}
              />
            </Group>

            <Group title={t("settings.preferences")}>
              <ToggleRow
                label={t("settings.backgroundPlay")}
                description={t("settings.backgroundPlayDesc")}
                on={settings.backgroundPlay}
                onChange={(v) => void saveBackgroundPlay(username, v)}
              />
              <ToggleRow
                label={t("settings.hideGender")}
                description={t("settings.hideGenderDesc")}
                on={settings.hideGender}
                onChange={(v) => void saveHideGender(username, v)}
              />
              <RowButton
                icon={<Languages size={18} />}
                label={t("settings.appLanguage")}
                value={APP_LANGUAGES.find((l) => l.code === language)?.native}
                last
                onClick={() => setPage("language")}
              />
            </Group>

            <Group title={t("settings.services")}>
              <RowButton
                icon={<Globe size={18} />}
                label={t("settings.privacyChoices")}
                onClick={() => setPage("privacy")}
              />
              <RowButton
                icon={<HelpCircle size={18} />}
                label={t("settings.help")}
                onClick={() => setPage("help")}
              />
              <RowButton
                icon={<LogOut size={18} />}
                label={t("settings.logout")}
                danger
                last
                onClick={logout}
              />
            </Group>

            {isCurrentUserAdmin(username) && (
              <div className="mt-5 space-y-3">
                <a
                  href="/admin"
                  className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-[14px] font-semibold text-white"
                >
                  Open admin panel
                </a>
                <div className="rounded-2xl border border-purple-400/25 bg-purple-500/10 p-3">
                  <AnnouncementsAdmin announcements={announcements} />
                </div>
              </div>
            )}
          </>
        )}

        {page === "items" && <MyItemsInventory username={username} />}

        {page === "subscriptions" && (
          <div className="-mx-4">
            <SubscribeWithPi variant="shop" isPremium={isPremium} premiumUntil={premiumUntil} />
            <div className="px-4">
              <p className="mt-3 text-[13px] text-yn-muted">
                {isPremiumActive(premiumUntil)
                  ? `${t("settings.premiumUntil")} ${
                      premiumUntil
                        ? new Date(premiumUntil).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""
                    }`
                  : t("settings.premiumInactive")}
              </p>
              {isPremiumActive(premiumUntil) ? (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    await cancelPremiumLocally(username, settings.profile?.uid);
                    setCancelling(false);
                  }}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-black/10 bg-yn-card text-[14px] font-semibold text-yn-text"
                >
                  {t("settings.cancelSubscription")}
                </button>
              ) : null}
              <p className="mt-2 text-[12px] leading-relaxed text-yn-muted">{t("settings.cancelNote")}</p>
            </div>
          </div>
        )}

        {page === "blocked" && (
          <div>
            {settings.blockedPeople.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-yn-card px-4 py-16 text-center">
                <Ban className="mx-auto mb-3 text-yn-muted" size={28} />
                <p className="text-[14px] text-yn-muted">{t("settings.noBlocked")}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/6 bg-yn-card">
                {settings.blockedPeople.map((person, i) => (
                  <div
                    key={person.id}
                    className={`flex min-h-14 items-center gap-3 px-3 py-2 ${
                      i < settings.blockedPeople.length - 1 ? "border-b border-black/6" : ""
                    }`}
                  >
                    <NeonAvatar src={person.photo} name={person.name} size={44} />
                    <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-yn-text">{person.name}</p>
                    <button
                      type="button"
                      onClick={() => void unblockUserForMe(username, person.id)}
                      className="h-11 rounded-xl bg-pink-50 px-3 text-[13px] font-semibold text-pink-700"
                    >
                      {t("settings.unblock")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {page === "neonId" && (
          <div className="rounded-2xl border border-black/6 bg-yn-card p-5 text-center">
            <p className="text-[12px] uppercase tracking-wide text-yn-muted">{t("settings.neonId")}</p>
            <p className="mt-3 break-all font-mono text-[22px] font-semibold tracking-wide text-yn-text">
              {settings.neonId || "…"}
            </p>
            <p className="mt-2 text-[12px] text-yn-muted">{t("settings.notEditable")}</p>
            <button
              type="button"
              onClick={() => void copyId()}
              className="mx-auto mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 text-[14px] font-semibold text-white"
            >
              <Copy size={16} />
              {copied ? t("common.copied") : t("common.copy")}
            </button>
          </div>
        )}

        {page === "account" && (
          <div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-12 w-full items-center gap-3 rounded-2xl bg-red-500/10 px-3.5 text-[15px] font-semibold text-red-300"
            >
              <Trash2 size={18} />
              {t("settings.deleteAccount")}
            </button>
          </div>
        )}

        {page === "language" && (
          <div className="space-y-1.5">
            {APP_LANGUAGES.map((lang) => {
              const on = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`flex h-12 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-medium ${
                    on
                      ? "border border-pink-300 bg-gradient-to-r from-fuchsia-50 to-pink-50 text-yn-text"
                      : "bg-yn-card text-yn-muted"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="flex-1">{lang.native}</span>
                  {on && <span className="text-yn-accent">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {page === "safety" && (
          <div className="space-y-3">
            {SAFETY_TIPS_SECTIONS.map((tip) => (
              <article key={tip.id} className="rounded-2xl border border-black/6 bg-yn-card p-4">
                <h3 className="text-[15px] font-semibold text-yn-text">{tip.title}</h3>
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-yn-muted">{tip.body}</p>
              </article>
            ))}
          </div>
        )}

        {page === "guidelines" && (
          <div className="space-y-3">
            <p className="px-1 text-[13px] leading-relaxed text-yn-muted">
              These are YouNeon’s own rules for video chat, gifts, and Pi. They are original copy for this app — not
              another company’s trademark or policy.
            </p>
            {COMMUNITY_GUIDELINES_SECTIONS.map((tip) => (
              <article key={tip.id} className="rounded-2xl border border-black/6 bg-yn-card p-4">
                <h3 className="text-[15px] font-semibold text-yn-text">{tip.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-yn-muted">{tip.body}</p>
              </article>
            ))}
          </div>
        )}

        {page === "privacy" && (
          <PrivacyPage
            consent={settings.privacyConsent}
            t={t}
            onChange={(next) => void savePrivacyConsent(username, next)}
          />
        )}

        {page === "help" && (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-yn-muted">{t("settings.helpIntro")}</p>
            <article className="rounded-2xl border border-black/6 bg-yn-card p-4">
              <h3 className="text-[15px] font-semibold text-yn-text">{t("settings.faqPayments")}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-yn-muted">{t("settings.faqPaymentsBody")}</p>
            </article>
            <article className="rounded-2xl border border-black/6 bg-yn-card p-4">
              <h3 className="text-[15px] font-semibold text-yn-text">{t("settings.faqMatching")}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-yn-muted">{t("settings.faqMatchingBody")}</p>
            </article>
            <article className="rounded-2xl border border-black/6 bg-yn-card p-4">
              <h3 className="text-[15px] font-semibold text-yn-text">{t("settings.faqSafety")}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-yn-muted">{t("settings.faqSafetyBody")}</p>
            </article>
            <article className="rounded-2xl border border-black/6 bg-yn-card p-4">
              <h3 className="text-[15px] font-semibold text-yn-text">{t("settings.contact")}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-yn-muted">{t("settings.contactBody")}</p>
              <a href="mailto:support@youneon.pi" className="mt-2 inline-block text-[14px] font-semibold text-yn-accent">
                support@youneon.pi
              </a>
            </article>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-black/8 bg-yn-card p-5">
            <h3 className="text-[17px] font-semibold text-yn-text">{t("settings.deleteConfirmTitle")}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-yn-muted">{t("settings.deleteConfirmBody")}</p>
            <button
              type="button"
              onClick={deleteAccount}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-red-600 text-[14px] font-semibold text-white"
            >
              {t("settings.deleteAccount")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-yn-bg text-[14px] font-semibold text-yn-text"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PrivacyPage({
  consent,
  t,
  onChange,
}: {
  consent: PrivacyConsent;
  t: (key: string) => string;
  onChange: (next: PrivacyConsent) => void;
}) {
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-black/6 bg-yn-card">
        <ToggleRow
          label={t("settings.necessary")}
          description={t("settings.necessaryDesc")}
          on
          disabled
          onChange={() => {}}
        />
        <ToggleRow
          label={t("settings.analytics")}
          description={t("settings.analyticsDesc")}
          on={consent.analytics}
          onChange={(v) => onChange({ ...consent, necessary: true, analytics: v })}
        />
        <ToggleRow
          label={t("settings.advertising")}
          description={t("settings.advertisingDesc")}
          on={consent.advertising}
          onChange={(v) => onChange({ ...consent, necessary: true, advertising: v })}
        />
        <ToggleRow
          label={t("settings.marketing")}
          description={t("settings.marketingDesc")}
          on={consent.marketing}
          onChange={(v) => onChange({ ...consent, necessary: true, marketing: v })}
          last
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({ necessary: true, analytics: false, advertising: false, marketing: false })
          }
          className="flex h-12 items-center justify-center rounded-xl border border-black/10 bg-yn-card text-[14px] font-semibold text-yn-text"
        >
          {t("settings.refuseAll")}
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({ necessary: true, analytics: true, advertising: true, marketing: true })
          }
          className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-[14px] font-semibold text-white"
        >
          {t("settings.acceptAll")}
        </button>
      </div>
    </div>
  );
}
