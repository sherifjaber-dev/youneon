/**
 * Production identity rules: only real Pi Network accounts.
 * Guest/demo/test placeholders must never become users, matches, or lounge rows.
 */

export const RESERVED_FAKE_IDS = [
  "anon",
  "pi_user",
  "guest_demo",
  "guest",
  "demo",
  "demo_user",
  "test",
  "test_user",
  "testuser",
  "mock_sofia",
  "mock_liam",
  "sofia_demo",
  "liam_demo",
  "seed_sofia",
  "seed_liam",
  "current_user_id",
] as const;

const RESERVED = new Set(RESERVED_FAKE_IDS.map((id) => id.toLowerCase()));

const FAKE_NAME_RE = /^(test(\s*user)?|guest(\s*\(demo\))?|demo(\s*user)?)$/i;
const FAKE_ID_PREFIX_RE = /^(test|demo|mock|seed|guest)([_-]|$)/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function isReservedFakeId(id?: string | null): boolean {
  const value = (id || "").trim().toLowerCase();
  if (!value) return true;
  if (RESERVED.has(value)) return true;
  if (FAKE_ID_PREFIX_RE.test(value)) return true;
  return false;
}

export function isFakeDisplayName(name?: string | null): boolean {
  const value = (name || "").trim();
  return !!value && FAKE_NAME_RE.test(value);
}

export function recordHasDemoFlag(data?: Record<string, unknown> | null): boolean {
  if (!data) return false;
  return (
    data.isTest === true ||
    data.isDemo === true ||
    data.seed === true ||
    data.isSeed === true ||
    data.demo === true ||
    data.test === true
  );
}

/** True only for a username/uid that may own a Firestore users/{id} doc. */
export function isRealPiUsername(value?: string | null): boolean {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  return !isReservedFakeId(trimmed);
}

export function isFakeUserRecord(id: string, data?: Record<string, unknown> | null): boolean {
  const rec = asRecord(data);
  if (recordHasDemoFlag(rec)) return true;
  const userId = String(rec?.userId || rec?.piUsername || rec?.uid || id || "").trim();
  if (!isRealPiUsername(userId) && !isRealPiUsername(id)) return true;
  const name = String(rec?.fullName || rec?.displayName || rec?.name || rec?.nickname || "").trim();
  if (isFakeDisplayName(name)) return true;
  return false;
}

export function isFakeQueuePeer(id: string, data?: Record<string, unknown> | null): boolean {
  const rec = asRecord(data);
  if (isFakeUserRecord(id, rec)) return true;
  const peerId = String(rec?.userId || id || "").trim();
  if (!isRealPiUsername(peerId)) return true;
  return false;
}
