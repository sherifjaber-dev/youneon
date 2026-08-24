import { api } from "./api";

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
  startedAt: Date;
}

/**
 * Find a random match based on filters
 * Simulates finding an available user from the pool
 */
export async function findRandomMatch(
  userId: string,
  filters: MatchFilters
): Promise<MatchResult> {
  try {
    const response = await api.post<{
      matchId: string;
      user: UserProfile;
    }>("/api/matches/find", {
      userId,
      filters,
    });

    return {
      matchId: response.data.matchId,
      user: response.data.user,
      startedAt: new Date(),
    };
  } catch (error) {
    console.error("Error finding match:", error);
    // Fallback: Return a mock user for demo purposes
    return getMockMatchedUser();
  }
}

/**
 * End a current match/call
 */
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

/**
 * Save match filters for future use
 */
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

/**
 * Get user's saved filters
 */
export async function getMatchFilters(userId: string): Promise<MatchFilters> {
  try {
    const response = await api.get<MatchFilters>(
      `/api/user/${userId}/filters`
    );
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

/**
 * Report a user during or after a call
 */
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

/**
 * Block a user
 */
export async function blockUser(blockedUserId: string) {
  try {
    await api.post("/api/user/blocks", {
      blockedUserId,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
  }
}

/**
 * Mock matched user for demo/fallback
 */
function getMockMatchedUser(): MatchResult {
  const mockUsers: UserProfile[] = [
    {
      id: "mock1",
      nickname: "Alex",
      age: 24,
      gender: "male",
      country: "USA",
      bio: "Love traveling and meeting new people!",
      interests: ["Travel", "Gaming", "Music"],
    },
    {
      id: "mock2",
      nickname: "Sofia",
      age: 22,
      gender: "female",
      country: "Brazil",
      bio: "Artist and language enthusiast",
      interests: ["Art", "Language Exchange", "Travel"],
    },
    {
      id: "mock3",
      nickname: "Jordan",
      age: 26,
      gender: "non-binary",
      country: "Canada",
      bio: "Tech enthusiast and fitness lover",
      interests: ["Technology", "Fitness", "Sports"],
    },
    {
      id: "mock4",
      nickname: "Maya",
      age: 23,
      gender: "female",
      country: "India",
      bio: "Dancer and foodie",
      interests: ["Music", "Cooking", "Friends"],
    },
    {
      id: "mock5",
      nickname: "Chris",
      age: 25,
      gender: "male",
      country: "UK",
      bio: "Photographer and travel blogger",
      interests: ["Travel", "Art", "Technology"],
    },
  ];

  const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];

  return {
    matchId: `match_${Date.now()}`,
    user: randomUser,
    startedAt: new Date(),
  };
}
