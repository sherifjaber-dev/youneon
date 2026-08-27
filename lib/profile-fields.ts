function asStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || out.includes(trimmed)) continue;
    out.push(trimmed);
  }
  return out;
}

/** Spoken languages from a user doc. Accepts languages / spokenLanguages / langs. */
export function readSpokenLanguages(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const rec = data as Record<string, unknown>;
  return asStringList(rec.languages ?? rec.spokenLanguages ?? rec.langs);
}

export function readStringList(raw: unknown): string[] {
  return asStringList(raw);
}
