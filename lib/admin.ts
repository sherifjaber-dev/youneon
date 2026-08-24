const ADMIN_FLAG_KEY = "youneon_admin";

function parseAdminUsernames(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_PI_USERNAMES || "";
  return raw
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUsername(username?: string | null): boolean {
  if (!username) return false;
  return parseAdminUsernames().includes(username.trim().toLowerCase());
}

export function hasLocalAdminOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function isCurrentUserAdmin(username?: string | null): boolean {
  return hasLocalAdminOverride() || isAdminUsername(username);
}
