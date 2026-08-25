"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnnouncementsAdmin } from "@/components/announcements-admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import {
  seedAnnouncementsIfEmpty,
  subscribeToAnnouncements,
  type Announcement,
} from "@/lib/announcements";
import { piAuthService } from "@/lib/pi-auth-service";
import { readLiteSession } from "@/lib/pi-client-session";

export default function AdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const piUser = piAuthService.getCurrentUser();
    const lite = readLiteSession();
    setUsername(piUser?.username || lite?.username || "");
    setReady(true);

    let unsub: (() => void) | undefined;
    seedAnnouncementsIfEmpty()
      .catch(() => {})
      .finally(() => {
        unsub = subscribeToAnnouncements(setAnnouncements);
      });
    return () => unsub?.();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-yn-bg text-yn-muted">
        Loading...
      </div>
    );
  }

  if (!isCurrentUserAdmin(username)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-yn-bg px-6 text-center text-yn-text">
        <p className="text-lg font-semibold">Admin only</p>
        <p className="mt-2 text-sm text-yn-muted">
          Sign in with an admin Pi username, or set localStorage youneon_admin=1 for testing.
        </p>
        <Link href="/" className="mt-6 text-sm font-semibold text-yn-accent">
          Back to YouNeon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-yn-bg px-4 py-8 text-yn-text">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-[13px] font-semibold text-yn-accent">
          ← YouNeon
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-yn-muted">Announcements appear in the notification bell and can feed ads.</p>
        <div className="mt-6">
          <AnnouncementsAdmin announcements={announcements} compact />
        </div>
      </div>
    </div>
  );
}
