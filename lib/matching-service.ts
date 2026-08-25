import { api } from "./api";
import {
  enqueueOrMatch,
  type MatchFilters as QueueFilters,
  type QueueProfile,
} from "./match-queue";
import { isRealPiUsername } from "./real-pi-user";

export interface MatchFilters {
  gender: string;
  ageMin: number;
  ageMax: number;
  country: string;
  interests: string[];
}

export interface UserProfile {
  id: string;
  nickname: string;
  age: number;
  gender: string;
  country: string;
  bio?: string;
  profileImage?: string;
  interests: string[];
}

export interface MatchResult {
  matchId: string;
  user: UserProfile;
  roomUrl: string;
  startedAt: Date;
}

function toQueueGender(gender: string): QueueFilters["gender"] {
  const g = (gender || "both").toLowerCase();
  if (g === "women" || g === "woman" || g === "female") return "women";
  if (g === "men" || g === "man" || g === "male") return "men";
  return "both";
}

/**
 * Find a random match: join an existing waiting peer's Daily room, or create one.
 */
export async function findRandomMatch(
  userId: string,
  filters: MatchFilters,
  options?: { isPremium?: boolean; profile?: QueueProfile; blockedIds?: string[] }
): Promise<MatchResult> {
  if (!isRealPiUsername(userId)) {
    throw new Error("Sign in with Pi Network to start a video chat.");
  }
  const session = await enqueueOrMatch({
    userId,
    profile: options?.profile || { userId, name: "User" },
    filters: {
      gender: toQueueGender(filters.gender),
      country: filters.country || "Worldwide",
    },
    blockedIds: options?.blockedIds,
    isPremium: !!options?.isPremium,
  });

  const partner = session.partner;
  return {
    matchId: session.queueId,
    roomUrl: session.roomUrl,
    user: partner
      ? {
          id: partner.userId,
          nickname: partner.name,
          age: partner.age || 0,
          gender: partner.gender || "",
          country: partner.country || "",
          bio: partner.bio,
          profileImage: partner.avatar,
          interests: partner.interests || [],
        }
      : {
          id: "",
          nickname: "Waiting",
          age: 0,
          gender: "",
          country: "",
          interests: [],
        },
    startedAt: new Date(),
  };
}

export async function endMatch(matchId: string, durationSeconds: number) {
  try {
    await api.post("/api/matches/end", {
      matchId,
      durationSeconds,
    });
  } catch (error) {
    console.error("Error ending match:", error);
  }
}

export async function saveMatchFilters(userId: string, filters: MatchFilters) {
  try {
    await api.post("/api/user/filters", {
      userId,
      filters,
    });
  } catch (error) {
    console.error("Error saving filters:", error);
  }
}

export async function getMatchFilters(userId: string): Promise<MatchFilters> {
  try {
    const response = await api.get<MatchFilters>(`/api/user/${userId}/filters`);
    return response.data;
  } catch (error) {
    console.error("Error fetching filters:", error);
    return {
      gender: "all",
      ageMin: 18,
      ageMax: 65,
      country: "All",
      interests: [],
    };
  }
}

export async function reportUser(reportedUserId: string, reason: string) {
  try {
    await api.post("/api/reports", {
      reportedUserId,
      reason,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error reporting user:", error);
  }
}

export async function blockUser(blockedUserId: string) {
  try {
    await api.post("/api/user/blocks", {
      blockedUserId,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
  }
}
