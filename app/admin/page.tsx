"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPanel } from "@/components/admin-panel";
import { isAdminUsername } from "@/lib/admin";
import { seedAnnouncementsIfEmpty, subscribeToAnnouncements, type Announcement } from "@/lib/announcements";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { piAuthService } from "@/lib/pi-auth-service";
import { readLiteSession } from "@/lib/pi-client-session";

export default function AdminPage() {
  const { user, accessToken } = usePiAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const piUser = piAuthService.getCurrentUser();
    const lite = readLiteSession();
    setUsername(user?.username || piUser?.username || lite?.username || "");
    setReady(true);
    void accessToken;
    let unsub: (() => void) | undefined;
    seedAnnouncementsIfEmpty()
      .catch(() => {})
      .finally(() => {
        unsub = subscribeToAnnouncements(setAnnouncements);
      });
    return () => unsub?.();
  }, [user, accessToken]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-yn-bg text-[15px] text-yn-muted">
        Loading…
      </div>
    );
  }

  if (!isAdminUsername(username)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-yn-bg px-6 text-center text-yn-text">
        <p className="text-[20px] font-semibold tracking-[-0.03em]">Admin only</p>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-yn-muted">
          This page is available only to the YouNeon operator account. Sign in with Pi Network as that account, then open /admin again.
        </p>
        <Link href="/" className="mt-6 text-[14px] font-semibold text-yn-accent">
          Back to YouNeon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-yn-bg px-4 py-8 text-yn-text">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-[13px] font-semibold text-yn-accent">
          ← YouNeon
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em]">Admin</h1>
        <p className="mt-1 text-[14px] leading-6 text-yn-muted">
          Promo codes, live reports, user search, and safety actions.
        </p>
        <div className="mt-6">
          <AdminPanel username={username} announcements={announcements} />
        </div>
      </div>
    </div>
  );
}
