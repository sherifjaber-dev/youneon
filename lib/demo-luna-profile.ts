import type { UserProfile } from "@/lib/firestore-service";
import type { LoungePerson } from "@/lib/lounge-service";

/** Isolated client-side seed. Never persist this id to Firestore. */
export const DEMO_LUNA_ID = "demo_luna";
export const DEMO_LUNA_PHOTO = "/demo/luna.jpg";

export function isDemoLunaId(id?: string | null): boolean {
  return (id || "").trim() === DEMO_LUNA_ID;
}

/** Reaction rows on the public profile use ReactionId keys, not gift ids. */
export const DEMO_LUNA_REACTIONS: Record<string, number> = {
  Awesome: 12,
  Funny: 28,
  Friendly: 15,
  "Magic Rabbit": 9,
  WOW: 17,
  Charming: 34,
  Rose: 21,
  Naughty: 8,
  Beautiful: 13,
  Fire: 19,
};

const REACTION_TOTAL = Object.values(DEMO_LUNA_REACTIONS).reduce((sum, n) => sum + n, 0);

export function demoLunaUserProfile(): UserProfile {
  return {
    id: DEMO_LUNA_ID,
    uid: DEMO_LUNA_ID,
    piUsername: DEMO_LUNA_ID,
    fullName: "Luna",
    age: 24,
    country: "Sweden",
    location: "Stockholm",
    gender: "Female",
    languages: ["English", "Swedish"],
    interests: ["Friends", "Sports", "Fashion", "Music", "Travel", "Gaming"],
    avatar: "Luna",
    profilePicture: DEMO_LUNA_PHOTO,
    photos: [DEMO_LUNA_PHOTO],
    bio: "Night owl with a soft spot for deep talks and spontaneous adventures. Let’s create memories that glow.",
    reactionsReceived: { ...DEMO_LUNA_REACTIONS },
    giftsReceivedCount: REACTION_TOTAL,
    hideGender: false,
  };
}

export function demoLunaLoungePerson(): LoungePerson {
  const now = Date.now();
  return {
    id: DEMO_LUNA_ID,
    name: "Luna",
    displayName: "Luna",
    photo: DEMO_LUNA_PHOTO,
    age: 24,
    country: "Sweden",
    gender: "Female",
    languages: ["English", "Swedish"],
    lastSeenMs: now,
    createdAtMs: now,
    giftsReceivedCount: REACTION_TOTAL,
    followersCount: 48,
    lat: 59.3293,
    lng: 18.0686,
    online: true,
    isLive: true,
  };
}

export function withDemoLunaFirst(people: LoungePerson[]): LoungePerson[] {
  const luna = demoLunaLoungePerson();
  return [luna, ...people.filter((person) => person.id !== DEMO_LUNA_ID)];
}
