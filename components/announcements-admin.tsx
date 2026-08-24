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
        <h3 className={`font-semibold ${compact ? "text-[13px] text-white" : "text-sm text-gray-900"}`}>
          Announcements
        </h3>
        <p className={compact ? "mt-0.5 text-[11px] text-white/45" : "mt-0.5 text-xs text-gray-500"}>
          Post system updates, news, promos, or ads. They appear in the notification bell.
        </p>
      </div>

      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={
            compact
              ? "h-11 w-full rounded-xl border border-white/12 bg-white/5 px-3 text-[15px] text-white placeholder:text-white/35"
              : "h-11 w-full rounded-xl border border-gray-300 px-3 text-[15px]"
          }
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={3}
          className={
            compact
              ? "w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-[15px] text-white placeholder:text-white/35"
              : "w-full rounded-xl border border-gray-300 px-3 py-2 text-[15px]"
          }
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`h-9 rounded-full px-3 text-[12px] font-semibold capitalize ${
                type === option
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : compact
                    ? "border border-white/12 text-white/60"
                    : "border border-gray-300 text-gray-600"
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
            className={
              compact
                ? "rounded-xl border border-white/8 bg-white/[0.04] p-3"
                : "rounded-xl border border-gray-200 bg-white p-3"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={compact ? "text-[13px] font-semibold text-white" : "text-sm font-semibold text-gray-900"}>
                  {item.title}
                </p>
                <p className={compact ? "mt-0.5 text-[11px] text-white/50" : "mt-0.5 text-xs text-gray-500"}>
                  {item.type} · {item.active ? "active" : "inactive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncementActive(item.id, !item.active)}
                className={`h-9 shrink-0 rounded-lg px-3 text-[12px] font-semibold ${
                  item.active
                    ? compact
                      ? "border border-white/15 text-white/70"
                      : "border border-gray-300 text-gray-600"
                    : compact
                      ? "bg-emerald-500/20 text-emerald-300"
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
