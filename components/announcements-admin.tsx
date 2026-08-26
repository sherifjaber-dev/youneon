"use client";

import { useState } from "react";
import type { Announcement, AnnouncementType } from "@/lib/announcements";
import { publishAnnouncement, setAnnouncementActive } from "@/lib/announcements";

const TYPES: AnnouncementType[] = ["system", "news", "promo", "ad"];

type AnnouncementsAdminProps = {
  announcements: Announcement[];
  compact?: boolean;
};

export function AnnouncementsAdmin({ announcements, compact = false }: AnnouncementsAdminProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AnnouncementType>("system");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await publishAnnouncement({ title, body, type });
      setTitle("");
      setBody("");
      setType("system");
      setMessage("Published.");
    } catch (error) {
      console.warn(error);
      setMessage("Could not publish. Try again.");
    }
    setBusy(false);
  };

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <h3 className="text-sm font-semibold text-yn-text">
          Announcements
        </h3>
        <p className="mt-0.5 text-xs text-yn-muted">
          Post system updates, news, promos, or ads. They appear in the notification bell.
        </p>
      </div>

      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="h-11 w-full rounded-xl border border-black/10 bg-yn-card px-3 text-[15px] text-yn-text placeholder:text-yn-muted"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={3}
          className="w-full rounded-xl border border-black/10 bg-yn-card px-3 py-2 text-[15px] text-yn-text placeholder:text-yn-muted"
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`h-9 rounded-full px-3 text-[12px] font-semibold capitalize ${
                type === option
                  ? "bg-[var(--pink)] text-white"
                  : "border border-black/10 text-yn-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handlePublish}
          disabled={busy || !title.trim() || !body.trim()}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Publishing..." : "Publish"}
        </button>
        {message && (
          <p className={compact ? "text-[12px] text-emerald-300" : "text-xs text-green-700"}>{message}</p>
        )}
      </div>

      <ul className="space-y-2">
        {announcements.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-black/8 bg-yn-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-yn-text">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-yn-muted">
                  {item.type} · {item.active ? "active" : "inactive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncementActive(item.id, !item.active)}
                className={`h-9 shrink-0 rounded-lg px-3 text-[12px] font-semibold ${
                  item.active
                    ? "border border-black/10 text-yn-muted"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {item.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
