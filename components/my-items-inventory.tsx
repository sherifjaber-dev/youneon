"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useUserSettings } from "@/hooks/use-user-settings";
import { piAuthService } from "@/lib/pi-auth-service";
import { claimPromoCode, remainingLabel } from "@/lib/user-settings";

export function MyItemsInventory({ username }: { username?: string }) {
  const { t } = useLanguage();
  const resolved = username || piAuthService.getCurrentUser()?.username || "";
  const settings = useUserSettings(resolved);
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [claiming, setClaiming] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/6 bg-yn-card p-3.5">
        <p className="text-[13px] font-semibold text-yn-muted">{t("settings.promoCode")}</p>
        <div className="mt-2 flex gap-2">
          <input
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder={t("settings.promoPlaceholder")}
            className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 text-[15px] text-yn-text outline-none placeholder:text-yn-muted"
          />
          <button
            type="button"
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              const result = await claimPromoCode(resolved, promo, {
                claimed: settings.claimedPromoCodes,
                items: settings.items,
              });
              setPromoMsg({ ok: result.ok, text: result.message });
              if (result.ok) setPromo("");
              setClaiming(false);
            }}
            className="h-12 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-4 text-[14px] font-semibold text-white"
          >
            {t("settings.claim")}
          </button>
        </div>
        {promoMsg ? (
          <p className={`mt-2 text-[12px] ${promoMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {promoMsg.text}
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-yn-muted">
          {t("settings.singleUseItems")}
        </h3>
        {settings.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-yn-card px-4 py-10 text-center">
            <p className="text-[14px] text-yn-muted">{t("settings.noItems")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/6 bg-yn-card">
            {settings.items.map((item, i) => (
              <div
                key={item.id}
                className={`flex min-h-12 items-center justify-between px-3.5 py-3 ${
                  i < settings.items.length - 1 ? "border-b border-black/6" : ""
                }`}
              >
                <div>
                  <p className="text-[15px] font-medium text-yn-text">{item.label}</p>
                  <p className="text-[12px] text-yn-muted">
                    {t("settings.expiresIn")}: {remainingLabel(item.expiresAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
