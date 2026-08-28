export function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (typeof ts === "object" && ts !== null && "toDate" in ts) {
    try {
      const d = (ts as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof ts === "object" && ts !== null && "toMillis" in ts) {
    try {
      const ms = (ts as { toMillis: () => number }).toMillis();
      if (typeof ms === "number" && Number.isFinite(ms)) return new Date(ms);
    } catch {
      return null;
    }
  }
  const d = new Date(ts as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toMillis(ts: unknown): number {
  return toDate(ts)?.getTime() ?? 0;
}

/** Azar-style clock: 10.42 AM */
function clockLabel(d: Date): string {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(":", ".");
}

/** e.g. "6 day(s) ago, 10.42 AM" or "16 Aug at 7.20 AM" */
export function formatHistoryWhen(ts: unknown): string {
  const d = toDate(ts);
  if (!d) return "Just now";
  const diff = Date.now() - d.getTime();
  if (diff < 45_000) return "Just now";
  const time = clockLabel(d);
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return time;
  if (days < 7) return `${days} day(s) ago, ${time}`;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month} at ${time}`;
}

/** Azar-style: 1h 16m, 19m, 12s */
export function formatCallDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

export function durationSecondsFromHistory(row: {
  durationSeconds?: number | null;
  duration?: string;
}): number | null {
  if (typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)) {
    return Math.max(0, Math.floor(row.durationSeconds));
  }
  const d = row.duration || "";
  const hourMin = d.match(/(\d+)\s*h(?:ours?)?\s*(\d+)\s*m/i);
  if (hourMin) return parseInt(hourMin[1], 10) * 3600 + parseInt(hourMin[2], 10) * 60;
  const minOnly = d.match(/(\d+)\s*min/i);
  if (minOnly) return parseInt(minOnly[1], 10) * 60;
  const secOnly = d.match(/(\d+)\s*s(?:ec(?:ond)?s?)?\b/i);
  if (secOnly && !/min/i.test(d)) return parseInt(secOnly[1], 10);
  return null;
}

export function displayDuration(row: {
  durationSeconds?: number | null;
  duration?: string;
}): string {
  const secs = durationSecondsFromHistory(row);
  if (secs != null) return formatCallDuration(secs);
  if (row.duration && row.duration !== "Random video chat") {
    return row.duration.replace(/\s*chat$/i, "").trim();
  }
  return "—";
}

export type GenderFilter = "all" | "female" | "male";

export function genderBucket(value?: string | null): GenderFilter | "other" {
  const v = (value || "").trim().toLowerCase();
  if (["woman", "women", "female", "f", "girl"].includes(v)) return "female";
  if (["man", "men", "male", "m", "boy"].includes(v)) return "male";
  return "other";
}
