"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ProfilePreviewSheet } from "@/components/call-remote-profile";
import { AnnouncementsAdmin } from "@/components/announcements-admin";
import { db } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { PromoCodeRecord } from "@/lib/promo-codes";
import type { AdminUserSummary } from "@/lib/admin-moderation";
import type { Announcement } from "@/lib/announcements";

type Tab = "promos" | "reports" | "search" | "reported" | "announcements" | "cleanup";

type LiveReport = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedName: string;
  reason: string;
  createdAtMs: number;
};

function formatWhen(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

async function adminAction(id: string, action: string, message?: string) {
  const { data } = await api.post<{ ok?: boolean; error?: string }>(`/api/admin/users/${encodeURIComponent(id)}`, {
    action,
    message,
  });
  return data;
}

export function AdminPanel({
  username,
  announcements,
}: {
  username: string;
  announcements: Announcement[];
}) {
  const [tab, setTab] = useState<Tab>("promos");
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [form, setForm] = useState({ code: "", neonAmount: "50", maxUses: "1", expiresAt: "" });
  const [reports, setReports] = useState<LiveReport[]>([]);
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<AdminUserSummary[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupResult, setCleanupResult] = useState("");

  const loadCodes = async () => {
    try {
      const { data } = await api.get<{ codes: PromoCodeRecord[] }>("/api/admin/promo");
      setCodes(data.codes || []);
    } catch (error) {
      setPromoMsg((error as { data?: { error?: string } })?.data?.error || "Could not load codes.");
    }
  };

  useEffect(() => {
    void loadCodes();
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, "reports"),
      (snap) => {
        const rows = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const created = data.createdAt as { toMillis?: () => number } | undefined;
            return {
              id: d.id,
              reporterId: String(data.reporterId || ""),
              reportedUserId: String(data.reportedUserId || ""),
              reportedName: String(data.reportedName || data.reportedUserId || ""),
              reason: String(data.reason || data.reasonLabel || ""),
              createdAtMs: created?.toMillis?.() || 0,
            };
        });
        rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setReports(rows);
      },
      () => setReports([])
    );
  }, []);

  const reportedOverview = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; lastMs: number }>();
    reports.forEach((row) => {
      const id = row.reportedUserId;
      if (!id) return;
      const prev = map.get(id) || { id, name: row.reportedName || id, count: 0, lastMs: 0 };
      prev.count += 1;
      prev.lastMs = Math.max(prev.lastMs, row.createdAtMs);
      if (row.reportedName) prev.name = row.reportedName;
      map.set(id, prev);
    });
    return [...map.values()].sort((a, b) => b.count - a.count || b.lastMs - a.lastMs);
  }, [reports]);

  const createCode = async () => {
    setPromoBusy(true);
    setPromoMsg("");
    try {
      await api.post("/api/admin/promo", {
        code: form.code,
        neonAmount: Number(form.neonAmount),
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setForm({ code: "", neonAmount: "50", maxUses: "1", expiresAt: "" });
      setPromoMsg("Code created.");
      await loadCodes();
    } catch (error) {
      setPromoMsg((error as { data?: { error?: string } })?.data?.error || "Could not create code.");
    }
    setPromoBusy(false);
  };

  const deactivate = async (code: string) => {
    try {
      await api.patch(`/api/admin/promo/${encodeURIComponent(code)}`);
      await loadCodes();
    } catch (error) {
      setPromoMsg((error as { data?: { error?: string } })?.data?.error || "Could not deactivate.");
    }
  };

  const runSearch = async () => {
    setSearchBusy(true);
    try {
      const { data } = await api.get<{ users: AdminUserSummary[] }>(
        `/api/admin/users?q=${encodeURIComponent(queryText.trim())}`
      );
      setResults(data.users || []);
    } catch {
      setResults([]);
    }
    setSearchBusy(false);
  };

  const runCleanup = async () => {
    if (cleanupBusy) return;
    const confirmed = window.confirm(
      "Delete only docs marked isTest / isDemo / seed, or reserved fake ids (guest_demo, pi_user, anon, test_*, demo_*). Real Pi users are kept."
    );
    if (!confirmed) return;
    setCleanupBusy(true);
    setCleanupResult("");
    try {
      const { data } = await api.post<{
        deleted?: Record<string, number>;
        error?: string;
      }>("/api/admin/cleanup-test-data");
      const deleted = data.deleted || {};
      setCleanupResult(
        `Removed ${deleted.users || 0} users, ${deleted.presence || 0} presence, ${deleted.matchQueue || 0} matchQueue, ${deleted.conversations || 0} conversations.`
      );
    } catch (error) {
      setCleanupResult(
        (error as { data?: { error?: string } })?.data?.error ||
          "Cleanup failed. If Firebase Admin is not on this host, use the Firebase Console steps shown here."
      );
    }
    setCleanupBusy(false);
  };

  const runUserAction = async (id: string, action: string) => {
    setActionMsg("");
    try {
      if (action === "warn") {
        const message = window.prompt("Warning message", "Please follow YouNeon Community Guidelines.") || "";
        if (!message.trim()) return;
        await adminAction(id, "warn", message.trim());
        setActionMsg("Warning sent.");
        return;
      }
      await adminAction(id, action);
      setActionMsg(action === "ban" ? "User banned." : action === "clear-reports" ? "Reports cleared." : "Done.");
      if (tab === "search") void runSearch();
    } catch (error) {
      setActionMsg((error as { data?: { error?: string } })?.data?.error || "Action failed.");
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "promos", label: "Promo codes" },
    { id: "reports", label: "Live reports" },
    { id: "reported", label: "Reported users" },
    { id: "search", label: "User search" },
    { id: "announcements", label: "Announcements" },
    { id: "cleanup", label: "Test data" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-[14px] leading-6 text-yn-muted">
        Signed in as <span className="font-semibold text-yn-text">{username}</span>. Only this Pi account can use these tools.
      </p>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`h-10 rounded-full px-4 text-[13px] font-semibold tracking-[-0.01em] ${
              tab === item.id
                ? "bg-[var(--pink)] text-white"
                : "border border-black/10 bg-white text-yn-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionMsg ? <p className="text-[13px] font-medium text-emerald-700">{actionMsg}</p> : null}

      {tab === "promos" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-yn-text">Create a promo code</h2>
            <p className="mt-1 text-[13px] leading-5 text-yn-muted">
              Users claim codes in My Items. Neon is credited on the server.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-yn-muted">
                Code
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="GLOW50"
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3 text-[15px] font-medium text-yn-text"
                />
              </label>
              <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-yn-muted">
                Neon amount
                <input
                  type="number"
                  min={1}
                  value={form.neonAmount}
                  onChange={(e) => setForm((f) => ({ ...f, neonAmount: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3 text-[15px] font-medium text-yn-text"
                />
              </label>
              <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-yn-muted">
                Max uses
                <input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3 text-[15px] font-medium text-yn-text"
                />
              </label>
              <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-yn-muted">
                Expiry (optional)
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 px-3 text-[15px] font-medium text-yn-text"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={promoBusy}
              onClick={() => void createCode()}
              className="mt-4 h-11 rounded-full bg-[var(--pink)] px-5 text-[14px] font-semibold text-white active:bg-[var(--pink-pressed)]"
            >
              Create code
            </button>
            {promoMsg ? <p className="mt-2 text-[13px] text-yn-muted">{promoMsg}</p> : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
            {codes.length === 0 ? (
              <p className="px-4 py-8 text-center text-[14px] text-yn-muted">No promo codes yet.</p>
            ) : (
              <div className="divide-y divide-black/6">
                {codes.map((code) => (
                  <div key={code.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-semibold tracking-[-0.02em] text-yn-text">{code.id}</p>
                        <p className="mt-0.5 text-[13px] text-yn-muted">
                          {code.neonAmount} Neon · {code.usedCount}/{code.maxUses} uses
                          {code.active ? "" : " · deactivated"}
                          {code.expiresAt ? ` · expires ${new Date(code.expiresAt).toLocaleDateString()}` : ""}
                        </p>
                        {code.usedBy.length > 0 ? (
                          <p className="mt-1 text-[12px] leading-5 text-yn-muted">
                            Claimed by {code.usedBy.map((row) => `${row.piUsername} (${new Date(row.at).toLocaleString()})`).join(" · ")}
                          </p>
                        ) : (
                          <p className="mt-1 text-[12px] text-yn-muted">Not claimed yet.</p>
                        )}
                      </div>
                      {code.active ? (
                        <button
                          type="button"
                          onClick={() => void deactivate(code.id)}
                          className="h-9 shrink-0 rounded-full border border-black/10 px-3 text-[12px] font-semibold text-yn-muted"
                        >
                          Deactivate
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === "reports" ? (
        <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
          {reports.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-yn-muted">No reports yet. New reports appear here instantly.</p>
          ) : (
            <div className="divide-y divide-black/6">
              {reports.map((row) => (
                <div key={row.id} className="px-4 py-3">
                  <p className="text-[15px] font-semibold text-yn-text">{row.reason || "Report"}</p>
                  <p className="mt-1 text-[13px] leading-5 text-yn-muted">
                    {row.reporterId} reported {row.reportedName || row.reportedUserId}
                  </p>
                  <p className="text-[12px] text-yn-muted">{formatWhen(row.createdAtMs)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="h-9 rounded-full border border-black/10 px-3 text-[12px] font-semibold" onClick={() => setPreviewId(row.reportedUserId)}>
                      View profile
                    </button>
                    <button type="button" className="h-9 rounded-full border border-black/10 px-3 text-[12px] font-semibold" onClick={() => void runUserAction(row.reportedUserId, "warn")}>
                      Warn
                    </button>
                    <button type="button" className="h-9 rounded-full bg-red-600 px-3 text-[12px] font-semibold text-white" onClick={() => void runUserAction(row.reportedUserId, "ban")}>
                      Ban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "reported" ? (
        <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
          {reportedOverview.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-yn-muted">No reported users.</p>
          ) : (
            <div className="divide-y divide-black/6">
              {reportedOverview.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[15px] font-semibold text-yn-text">{row.name}</p>
                    <p className="text-[13px] text-yn-muted">
                      {row.count} report{row.count === 1 ? "" : "s"} · last {formatWhen(row.lastMs)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="h-9 rounded-full border border-black/10 px-3 text-[12px] font-semibold" onClick={() => setPreviewId(row.id)}>
                      View
                    </button>
                    <button type="button" className="h-9 rounded-full bg-red-600 px-3 text-[12px] font-semibold text-white" onClick={() => void runUserAction(row.id, "ban")}>
                      Ban
                    </button>
                    <button type="button" className="h-9 rounded-full border border-black/10 px-3 text-[12px] font-semibold" onClick={() => void runUserAction(row.id, "clear-reports")}>
                      Clear reports
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "search" ? (
        <section className="space-y-3">
          <div className="flex gap-2">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch();
              }}
              placeholder="Username or Neon ID"
              className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 text-[15px] text-yn-text"
            />
            <button
              type="button"
              disabled={searchBusy}
              onClick={() => void runSearch()}
              className="h-12 rounded-xl bg-[var(--pink)] px-4 text-[14px] font-semibold text-white active:bg-[var(--pink-pressed)]"
            >
              Search
            </button>
          </div>
          {results.map((user) => (
            <div key={user.id} className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
              <p className="text-[16px] font-semibold text-yn-text">{user.fullName || user.piUsername}</p>
              <p className="text-[13px] text-yn-muted">
                @{user.piUsername}
                {user.neonId ? ` · ${user.neonId}` : ""}
                {user.banned ? " · banned" : ""}
                {` · ${user.reportsReceivedCount} reports`}
              </p>
              {user.warnings.length > 0 ? (
                <p className="mt-2 text-[12px] leading-5 text-yn-muted">
                  Warnings: {user.warnings.map((w) => w.message).join(" · ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="h-9 rounded-full border border-black/10 px-3 text-[12px] font-semibold" onClick={() => setPreviewId(user.id)}>
                  Open profile
                </button>
                <button type="button" className="h-9 rounded-full border border-black/10 px-3 text-[12px] font-semibold" onClick={() => void runUserAction(user.id, "warn")}>
                  Warn
                </button>
                <button type="button" className="h-9 rounded-full bg-red-600 px-3 text-[12px] font-semibold text-white" onClick={() => void runUserAction(user.id, user.banned ? "unban" : "ban")}>
                  {user.banned ? "Unban" : "Ban"}
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "announcements" ? <AnnouncementsAdmin announcements={announcements} compact /> : null}

      {tab === "cleanup" ? (
        <section className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-yn-text">Remove test / demo data</h2>
          <p className="mt-2 text-[14px] leading-6 text-yn-muted">
            One-shot cleanup. Deletes only documents marked <code>isTest</code>, <code>isDemo</code>, or <code>seed</code>,
            or reserved fake ids such as <code>guest_demo</code>, <code>pi_user</code>, <code>anon</code>, and <code>test_*</code>.
            Real Pi accounts are not mass-deleted.
          </p>
          <p className="mt-3 text-[13px] leading-6 text-yn-muted">
            Needs Firebase Admin credentials on the host. If this action fails, in Firebase Console delete matching docs from
            <strong> presence</strong> and <strong> matchQueue</strong> first (same flags / fake ids), then only those same ids under
            <strong> users</strong> and any <strong> conversations</strong> whose participants include them.
          </p>
          <button
            type="button"
            disabled={cleanupBusy}
            onClick={() => void runCleanup()}
            className="mt-4 h-11 rounded-full bg-[var(--pink)] px-5 text-[14px] font-semibold text-white active:bg-[var(--pink-pressed)] disabled:opacity-60"
          >
            {cleanupBusy ? "Cleaning…" : "Delete marked test data"}
          </button>
          {cleanupResult ? <p className="mt-3 text-[13px] leading-5 text-yn-muted">{cleanupResult}</p> : null}
        </section>
      ) : null}

      <ProfilePreviewSheet
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        userId={previewId || undefined}
        viewerId={username}
        standalone
        isSelf={false}
      />
    </div>
  );
}
