const DEFAULT_ADMINS = ["sherifjaber"];

function parseAdminUsernames(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_PI_USERNAMES || "";
  const fromEnv = raw
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ADMINS, ...fromEnv]));
}

export function isAdminUsername(username?: string | null): boolean {
  if (!username) return false;
  return parseAdminUsernames().includes(username.trim().toLowerCase());
}

export function isCurrentUserAdmin(username?: string | null): boolean {
  return isAdminUsername(username);
}
