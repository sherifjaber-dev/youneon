export const MAX_PHOTOS = 4;
export const MAX_INTERESTS = 8;
export const MAX_LANGUAGES = 5;
export const NAME_MAX = 20;
export const BIO_MAX = 250;
export const NAME_CHANGES_PER_MONTH = 3;
export const AGE_MIN = 18;
export const AGE_MAX = 99;

export type InterestCategory = {
  id: string;
  emoji: string;
  label: string;
  tags: string[];
};

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "food",
    emoji: "🍔",
    label: "Food",
    tags: [
      "Coffee", "Tea", "Street Food", "Baking", "Cooking", "Vegan", "Sushi",
      "Pizza", "Brunch", "Wine", "Chocolate", "BBQ", "Desserts", "Healthy Eating",
      "Spicy Food", "Seafood", "Vegetarian",
    ],
  },
  {
    id: "travel",
    emoji: "🧳",
    label: "Travel",
    tags: [
      "Travel", "Backpacking", "Road Trips", "Beaches", "Mountains", "City Breaks",
      "Camping", "Adventure", "Hiking", "Photography", "Culture", "Languages",
      "Airports", "Nature", "Islands",
    ],
  },
  {
    id: "music",
    emoji: "🎵",
    label: "Music",
    tags: [
      "Music", "Pop", "Hip Hop", "Rock", "Indie", "EDM", "Jazz", "K-Pop",
      "Classical", "R&B", "Concerts", "Karaoke", "Guitar", "Dancing", "Singing",
      "Festivals",
    ],
  },
  {
    id: "movies",
    emoji: "🎬",
    label: "Movies & TV",
    tags: [
      "Movies", "Netflix", "Anime", "K-Drama", "Comedy", "Horror", "Sci-Fi",
      "Documentaries", "Marvel", "Series Binge", "Cinema", "Animation",
      "Thriller", "Romance Movies",
    ],
  },
  {
    id: "fashion",
    emoji: "👗",
    label: "Fashion",
    tags: [
      "Fashion", "Streetwear", "Makeup", "Skincare", "Sneakers", "Thrifting",
      "Luxury", "Hair", "Jewelry", "Nails", "Style", "Shopping",
    ],
  },
  {
    id: "business",
    emoji: "💼",
    label: "Business",
    tags: [
      "Business", "Startups", "Entrepreneurship", "Investing", "Marketing",
      "Technology", "Remote Work", "Leadership", "Networking", "Side Hustle",
      "Crypto", "Design",
    ],
  },
  {
    id: "automotive",
    emoji: "🚗",
    label: "Automotive",
    tags: [
      "Cars", "Motorcycles", "Electric Cars", "Racing", "Road Trips",
      "Classic Cars", "Bikes",
    ],
  },
  {
    id: "relationships",
    emoji: "🙌",
    label: "Relationships",
    tags: [
      "Friends", "Going Out", "Parties", "Flirting", "Meeting New People",
      "Love", "Socializing", "Relationships", "Marriage", "Family", "Empathy",
      "Teamwork", "Community", "Volunteering", "Communication",
      "Interpersonal Skills", "Staying In",
    ],
  },
  {
    id: "sports",
    emoji: "⚽",
    label: "Sports",
    tags: [
      "Football", "Basketball", "Gym", "Fitness", "Yoga", "Running", "Swimming",
      "Tennis", "Boxing", "Cycling", "Martial Arts", "Workout", "Pilates",
    ],
  },
  {
    id: "gaming",
    emoji: "🎮",
    label: "Gaming",
    tags: [
      "Gaming", "PC Gaming", "PlayStation", "Xbox", "Nintendo", "Mobile Games",
      "Esports", "Chess", "Board Games", "VR",
    ],
  },
  {
    id: "lifestyle",
    emoji: "✨",
    label: "Lifestyle",
    tags: [
      "Art", "Books", "Photography", "Pets", "Dogs", "Cats", "Meditation",
      "Self Care", "Astrology", "Night Owl", "Early Bird", "Memes",
      "Language Exchange", "Education",
    ],
  },
];

export const INTEREST_EMOJI: Record<string, string> = {
  Friends: "🙌",
  "Going Out": "💃",
  Parties: "🍻",
  Flirting: "🤝",
  Love: "❤️",
  Family: "👨‍👩‍👧",
  Music: "🎵",
  Travel: "🧳",
  Gaming: "🎮",
  Movies: "🎬",
  Food: "🍔",
  Coffee: "☕",
  Gym: "💪",
  Fitness: "🏋️",
  Fashion: "👗",
  Art: "🎨",
  Photography: "📷",
  Books: "📚",
  Anime: "🍥",
  Football: "⚽",
  Dogs: "🐶",
  Cats: "🐱",
  Yoga: "🧘",
  Cooking: "👨‍🍳",
  Dancing: "💃",
  Concerts: "🎤",
  Hiking: "🥾",
  Technology: "💻",
  Business: "💼",
};

export function interestEmoji(tag: string): string {
  return INTEREST_EMOJI[tag] || "✦";
}

/** Catalog emoji for a tag: named icon, else category emoji, else raised hands. */
export function interestIcon(tag: string): string {
  if (INTEREST_EMOJI[tag]) return INTEREST_EMOJI[tag];
  const cat = INTEREST_CATEGORIES.find((c) => c.tags.includes(tag));
  return cat?.emoji || "🙌";
}

export const ALL_INTEREST_TAGS: string[] = Array.from(
  new Set(INTEREST_CATEGORIES.flatMap((c) => c.tags))
);

export type SpokenLanguage = {
  id: string;
  native: string;
};

export const SPOKEN_LANGUAGES: SpokenLanguage[] = [
  { id: "English", native: "English" },
  { id: "Danish", native: "Dansk" },
  { id: "Arabic", native: "العربية" },
  { id: "Swedish", native: "Svenska" },
  { id: "Norwegian", native: "Norsk" },
  { id: "German", native: "Deutsch" },
  { id: "French", native: "Français" },
  { id: "Spanish", native: "Español" },
  { id: "Italian", native: "Italiano" },
  { id: "Portuguese", native: "Português" },
  { id: "Russian", native: "Русский" },
  { id: "Turkish", native: "Türkçe" },
  { id: "Dutch", native: "Nederlands" },
  { id: "Polish", native: "Polski" },
  { id: "Ukrainian", native: "Українська" },
  { id: "Japanese", native: "日本語" },
  { id: "Korean", native: "한국어" },
  { id: "Chinese", native: "中文" },
  { id: "Hindi", native: "हिन्दी" },
  { id: "Greek", native: "Ελληνικά" },
  { id: "Finnish", native: "Suomi" },
  { id: "Czech", native: "Čeština" },
  { id: "Indonesian", native: "Bahasa Indonesia" },
  { id: "Thai", native: "ไทย" },
  { id: "Vietnamese", native: "Tiếng Việt" },
];

const LANGUAGE_ALIASES: Record<string, string> = {
  dansk: "Danish",
  danish: "Danish",
  العربية: "Arabic",
  arabic: "Arabic",
  svenska: "Swedish",
  swedish: "Swedish",
  norsk: "Norwegian",
  norwegian: "Norwegian",
  deutsch: "German",
  german: "German",
  français: "French",
  french: "French",
  español: "Spanish",
  spanish: "Spanish",
  italiano: "Italian",
  italian: "Italian",
  português: "Portuguese",
  portuguese: "Portuguese",
  русский: "Russian",
  russian: "Russian",
  türkçe: "Turkish",
  turkish: "Turkish",
  english: "English",
};

export function canonicalLanguage(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const mapped = LANGUAGE_ALIASES[trimmed.toLowerCase()];
  if (mapped) return mapped;
  const known = SPOKEN_LANGUAGES.find(
    (l) => l.id === trimmed || l.native === trimmed
  );
  return known?.id || trimmed;
}

export function languageLabel(id: string): string {
  const row = SPOKEN_LANGUAGES.find((l) => l.id === id);
  if (!row) return id;
  return row.native === row.id ? row.id : row.native;
}

export const REACTION_TYPES = [
  { id: "Awesome", emoji: "👍" },
  { id: "Funny", emoji: "😂" },
  { id: "Friendly", emoji: "🙌" },
  { id: "Magic Rabbit", emoji: "🪄" },
  { id: "WOW", emoji: "😲" },
  { id: "Charming", emoji: "❤️" },
  { id: "Rose", emoji: "🌹" },
] as const;

export type ReactionId = (typeof REACTION_TYPES)[number]["id"];

export const EMPTY_REACTIONS: Record<string, number> = Object.fromEntries(
  REACTION_TYPES.map((r) => [r.id, 0])
);

/** Map in-call gift ids onto reaction rows. Unmapped types stay at 0. */
export const GIFT_TO_REACTION: Record<string, ReactionId> = {
  rose: "Rose",
  heart: "Charming",
  bouquet: "Friendly",
  diamond: "WOW",
  gift: "Awesome",
  teddy: "Funny",
};

export type CompletenessInput = {
  profilePicture?: string;
  photos?: string[];
  fullName?: string;
  age?: number;
  bio?: string;
  country?: string;
  languages?: string[];
  interests?: string[];
};

export function hasProfilePhoto(input: CompletenessInput): boolean {
  if (input.profilePicture && input.profilePicture.trim()) return true;
  return Array.isArray(input.photos) && input.photos.some((p) => !!p?.trim());
}

export function profileCompleteness(input: CompletenessInput): {
  percent: number;
  checks: { key: string; ok: boolean }[];
} {
  const checks = [
    { key: "photo", ok: hasProfilePhoto(input) },
    { key: "name", ok: (input.fullName || "").trim().length >= 2 },
    {
      key: "age",
      ok:
        typeof input.age === "number" &&
        Number.isFinite(input.age) &&
        input.age >= AGE_MIN &&
        input.age <= AGE_MAX,
    },
    { key: "bio", ok: (input.bio || "").trim().length > 0 },
    { key: "country", ok: !!(input.country && input.country.trim()) },
    {
      key: "languages",
      ok: Array.isArray(input.languages) && input.languages.length > 0,
    },
    {
      key: "interests",
      ok: Array.isArray(input.interests) && input.interests.length > 0,
    },
  ];
  const done = checks.filter((c) => c.ok).length;
  return { percent: Math.round((done / checks.length) * 100), checks };
}

export function currentYearMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function nameChangesLeft(
  month?: string,
  count?: number,
  now = new Date()
): number {
  const ym = currentYearMonth(now);
  if (month !== ym) return NAME_CHANGES_PER_MONTH;
  const used = typeof count === "number" && count > 0 ? count : 0;
  return Math.max(0, NAME_CHANGES_PER_MONTH - used);
}

export function reactionCount(
  map: Record<string, number> | undefined,
  id: string
): number {
  const n = map?.[id];
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function totalReactions(map?: Record<string, number>): number {
  return REACTION_TYPES.reduce((sum, r) => sum + reactionCount(map, r.id), 0);
}
