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

export function isoToFlagEmoji(iso: string): string {
  const cc = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
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

/** Map a country name, ISO code, or existing flag emoji to a flag emoji. */
export function countryToFlag(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  const raw = input.trim();
  if (!raw) return "";
  const existing = extractFlagEmoji(raw);
  if (existing) return existing;
  if (/^[a-zA-Z]{2}$/.test(raw)) return isoToFlagEmoji(raw);
  const iso = COUNTRY_ISO[raw.toLowerCase()];
  return iso ? isoToFlagEmoji(iso) : "";
}

/** Human country label; skips pure flag-emoji strings. */
export function countryLabel(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  const raw = input.trim();
  if (!raw) return "";
  if (extractFlagEmoji(raw) && raw.length <= 4) return "";
  if (/^[a-zA-Z]{2}$/.test(raw)) {
    const match = Object.entries(COUNTRY_ISO).find(([, iso]) => iso === raw.toUpperCase());
    if (match && match[0].length > 2) {
      return match[0].replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return "";
  }
  return raw;
}
