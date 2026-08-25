/** Shared country list for Discover filters and Edit Profile. */
export const COUNTRY_OPTIONS = [
  "United States", "United Kingdom", "Germany", "France", "Brazil",
  "India", "Saudi Arabia", "Egypt", "Nigeria", "South Africa", "China", "Japan",
  "South Korea", "Turkey", "Sweden", "Denmark", "Netherlands", "Spain", "Italy",
  "Canada", "Australia", "Indonesia", "Thailand", "Vietnam", "Pakistan", "Kenya",
  "Ghana", "Morocco", "United Arab Emirates", "Mexico", "Argentina", "Colombia",
  "Chile", "Peru", "Russia", "Poland", "Greece", "Portugal", "Belgium",
  "Switzerland", "Austria", "Ireland", "Finland", "Czech Republic", "Hungary",
  "Singapore", "Malaysia", "Philippines", "Bangladesh", "Iran", "Iraq", "Syria", "Yemen",
] as const;

export type CountryOption = (typeof COUNTRY_OPTIONS)[number];

export function isCountryOption(value: string): value is CountryOption {
  return (COUNTRY_OPTIONS as readonly string[]).includes(value);
}

/** ISO 3166-1 alpha-2 lookup from country names, aliases, and codes. */
const COUNTRY_ISO: Record<string, string> = {
  "united states": "US", usa: "US", us: "US", america: "US",
  "united kingdom": "GB", uk: "GB", gb: "GB", britain: "GB", england: "GB",
  germany: "DE", de: "DE", france: "FR", fr: "FR", brazil: "BR", br: "BR",
  india: "IN", in: "IN", "saudi arabia": "SA", ksa: "SA", sa: "SA",
  egypt: "EG", eg: "EG", nigeria: "NG", ng: "NG",
  "south africa": "ZA", za: "ZA", china: "CN", cn: "CN", japan: "JP", jp: "JP",
  "south korea": "KR", korea: "KR", kr: "KR", turkey: "TR", tr: "TR",
  sweden: "SE", se: "SE", denmark: "DK", dk: "DK",
  netherlands: "NL", holland: "NL", nl: "NL", spain: "ES", es: "ES",
  italy: "IT", it: "IT", canada: "CA", ca: "CA", australia: "AU", au: "AU",
  indonesia: "ID", id: "ID", thailand: "TH", th: "TH", vietnam: "VN", vn: "VN",
  pakistan: "PK", pk: "PK", kenya: "KE", ke: "KE", ghana: "GH", gh: "GH",
  morocco: "MA", ma: "MA", "united arab emirates": "AE", uae: "AE", ae: "AE",
  mexico: "MX", mx: "MX", argentina: "AR", ar: "AR", colombia: "CO", co: "CO",
  chile: "CL", cl: "CL", peru: "PE", pe: "PE", russia: "RU", ru: "RU",
  poland: "PL", pl: "PL", greece: "GR", gr: "GR", portugal: "PT", pt: "PT",
  belgium: "BE", be: "BE", switzerland: "CH", ch: "CH", austria: "AT", at: "AT",
  ireland: "IE", ie: "IE", finland: "FI", fi: "FI",
  "czech republic": "CZ", czechia: "CZ", cz: "CZ", hungary: "HU", hu: "HU",
  singapore: "SG", sg: "SG", malaysia: "MY", my: "MY",
  philippines: "PH", ph: "PH", bangladesh: "BD", bd: "BD",
  iran: "IR", ir: "IR", iraq: "IQ", iq: "IQ", syria: "SY", sy: "SY", yemen: "YE", ye: "YE",
  norway: "NO", no: "NO", "new zealand": "NZ", nz: "NZ",
  palestine: "PS", ps: "PS", jordan: "JO", jo: "JO", lebanon: "LB", lb: "LB",
  kuwait: "KW", kw: "KW", qatar: "QA", qa: "QA", bahrain: "BH", bh: "BH",
  oman: "OM", om: "OM", tunisia: "TN", tn: "TN", algeria: "DZ", dz: "DZ",
  sudan: "SD", sd: "SD", ethiopia: "ET", et: "ET", tanzania: "TZ", tz: "TZ",
  uganda: "UG", ug: "UG", "sri lanka": "LK", lk: "LK", nepal: "NP", np: "NP",
  "hong kong": "HK", hk: "HK", taiwan: "TW", tw: "TW",
};

function titleCaseCountry(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Canonical English names for ISO codes we know. */
const ISO_TO_NAME: Record<string, string> = {};
for (const [key, iso] of Object.entries(COUNTRY_ISO)) {
  if (/^[a-z]{2,3}$/.test(key)) continue;
  const pretty = titleCaseCountry(key);
  if (!ISO_TO_NAME[iso] || pretty.length > ISO_TO_NAME[iso].length) {
    ISO_TO_NAME[iso] = pretty;
  }
}
for (const name of COUNTRY_OPTIONS) {
  const iso = COUNTRY_ISO[name.toLowerCase()];
  if (iso) ISO_TO_NAME[iso] = name;
}

export function listedFlagIsos(): string[] {
  return [...new Set(Object.values(COUNTRY_ISO))].sort();
}

function extractFlagEmoji(value: string): string {
  const chars = [...value];
  for (let i = 0; i < chars.length - 1; i++) {
    const a = chars[i].codePointAt(0) || 0;
    const b = chars[i + 1].codePointAt(0) || 0;
    if (a >= 0x1f1e6 && a <= 0x1f1ff && b >= 0x1f1e6 && b <= 0x1f1ff) {
      return chars[i] + chars[i + 1];
    }
  }
  return "";
}

function flagEmojiToIso(emoji: string): string {
  const chars = [...emoji];
  if (chars.length < 2) return "";
  const a = chars[0].codePointAt(0) || 0;
  const b = chars[1].codePointAt(0) || 0;
  if (a < 0x1f1e6 || a > 0x1f1ff || b < 0x1f1e6 || b > 0x1f1ff) return "";
  return String.fromCharCode(a - 127397, b - 127397);
}

/** Resolve a name, ISO code, or regional-indicator emoji to ISO 3166-1 alpha-2. */
export function countryToIso(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  const raw = input.trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "all" || lower === "worldwide" || lower === "global") return "";
  const emoji = extractFlagEmoji(raw);
  if (emoji) return flagEmojiToIso(emoji);
  if (/^[a-zA-Z]{2}$/.test(raw)) return raw.toUpperCase();
  return COUNTRY_ISO[lower] || "";
}

/**
 * SVG URL for an ISO alpha-2 code.
 * Images are MIT-licensed flag-icons (lipis) 4×3, vendored under /public/flags.
 */
export function flagSvgUrl(iso: string): string {
  return `/flags/${iso.trim().toLowerCase()}.svg`;
}

/** jsDelivr CDN of the same flag-icons set, used if a local SVG is missing. */
export function flagSvgCdnUrl(iso: string): string {
  return `https://cdn.jsdelivr.net/npm/flag-icons@7.3.2/flags/4x3/${iso.trim().toLowerCase()}.svg`;
}

export function isoToFlagEmoji(iso: string): string {
  const cc = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
}

/** @deprecated UI should use CountryFlag / CountryLabel. Kept for stored emoji data. */
export function countryToFlag(input?: string | null): string {
  const iso = countryToIso(input);
  return iso ? isoToFlagEmoji(iso) : "";
}

/** Human country label; skips pure flag-emoji strings. */
export function countryLabel(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  const raw = input.trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "all" || lower === "worldwide" || lower === "global") return raw;
  const iso = countryToIso(raw);
  if (iso && ISO_TO_NAME[iso]) return ISO_TO_NAME[iso];
  const stripped = raw
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return iso ? iso : "";
  if (/^[a-zA-Z]{2}$/.test(stripped)) {
    const code = stripped.toUpperCase();
    return ISO_TO_NAME[code] || "";
  }
  return stripped;
}
