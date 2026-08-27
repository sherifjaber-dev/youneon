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
  "lucas",
  "marcus",
  "sofia",
  "liam",
  "mock_sofia",
  "mock_liam",
  "sofia_demo",
  "liam_demo",
  "seed_sofia",
  "seed_liam",
  "demo_luna",
  "current_user_id",
] as const;

/** Seeded mockup first names that were written into History / Messages during design. */
export const SEEDED_FAKE_NAMES = ["lucas", "marcus", "sofia", "liam"] as const;

/**
 * Pi usernames used in design/test threads. Keep their user docs, but hide and
 * purge History / Messages / follows so launch lists are empty of test rows.
 */
export const LAUNCH_TEST_USERNAMES = ["bgrlt0428", "helinxi6789"] as const;

export const PROTECTED_PI_USERNAMES = ["sherifjaber"] as const;

const RESERVED = new Set(RESERVED_FAKE_IDS.map((id) => id.toLowerCase()));
const SEEDED_NAMES = new Set(SEEDED_FAKE_NAMES.map((name) => name.toLowerCase()));
const LAUNCH_TEST = new Set(LAUNCH_TEST_USERNAMES.map((id) => id.toLowerCase()));
const PROTECTED = new Set(PROTECTED_PI_USERNAMES.map((id) => id.toLowerCase()));

const FAKE_NAME_RE = /^(test(\s*user)?|guest(\s*\(demo\))?|demo(\s*user)?)$/i;
const FAKE_ID_PREFIX_RE = /^(test|demo|mock|seed|guest)([_-]|$)/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeToken(value?: string | null): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function isProtectedPiUsername(id?: string | null): boolean {
  const value = normalizeToken(id);
  return !!value && PROTECTED.has(value);
}

export function isLaunchTestUsername(id?: string | null): boolean {
  const value = normalizeToken(id);
  if (!value || PROTECTED.has(value)) return false;
  return LAUNCH_TEST.has(value);
}

export function isReservedFakeId(id?: string | null): boolean {
  const value = (id || "").trim().toLowerCase();
  if (!value) return true;
  if (PROTECTED.has(normalizeToken(value))) return false;
  if (RESERVED.has(value) || RESERVED.has(normalizeToken(value))) return true;
  if (FAKE_ID_PREFIX_RE.test(value)) return true;
  return false;
}

export function isFakeDisplayName(name?: string | null): boolean {
  const raw = (name || "").trim();
  if (!raw) return false;
  if (FAKE_NAME_RE.test(raw)) return true;
  const normalized = normalizeToken(raw);
  return !!normalized && SEEDED_NAMES.has(normalized);
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

/**
 * Hide from History, Messages, and follow strips. Includes seeded Lucas/Marcus
 * and launch-test Pi accounts. Never hides Sherifjaber.
 */
export function isHiddenSocialPeer(id?: string | null, name?: string | null): boolean {
  if (isProtectedPiUsername(id) || isProtectedPiUsername(name)) return false;
  if (isLaunchTestUsername(id)) return true;
  if (isReservedFakeId(id)) return true;
  if (isFakeDisplayName(name) || isFakeDisplayName(id)) return true;
  return false;
}

export function isFakeUserRecord(id: string, data?: Record<string, unknown> | null): boolean {
  if (isProtectedPiUsername(id)) return false;
  const rec = asRecord(data);
  const userId = String(rec?.userId || rec?.piUsername || rec?.uid || id || "").trim();
  if (isProtectedPiUsername(userId)) return false;
  // Keep real Pi test-login accounts; only wipe seeded / flagged docs.
  if (isLaunchTestUsername(id) || isLaunchTestUsername(userId)) {
    return recordHasDemoFlag(rec);
  }
  if (recordHasDemoFlag(rec)) return true;
  if (!isRealPiUsername(userId) && !isRealPiUsername(id)) return true;
  const name = String(rec?.fullName || rec?.displayName || rec?.name || rec?.nickname || "").trim();
  if (isFakeDisplayName(name) || isFakeDisplayName(id) || isFakeDisplayName(userId)) return true;
  return false;
}

export function isFakeQueuePeer(id: string, data?: Record<string, unknown> | null): boolean {
  if (isProtectedPiUsername(id)) return false;
  const rec = asRecord(data);
  if (isFakeUserRecord(id, rec)) return true;
  const peerId = String(rec?.userId || id || "").trim();
  if (!isRealPiUsername(peerId)) return true;
  return false;
}
