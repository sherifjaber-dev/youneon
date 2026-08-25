import {
  collection, addDoc, getDocs, getDoc, setDoc, updateDoc, doc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { GIFT_TO_REACTION } from "@/lib/profile-catalog";

export interface UserProfile {
  id?: string;
  uid?: string;
  piUsername: string;
  fullName: string;
  age: number;
  country: string;
  location?: string;
  gender?: string;
  languages: string[];
  interests: string[];
  avatar?: string;
  profilePicture?: string;
  photos?: string[];
  bio?: string;
  premiumUntil?: string;
  lastPaymentId?: string;
  neonBalance?: number;
  giftsReceivedCount?: number;
  reactionsReceived?: Record<string, number>;
  nameChangeMonth?: string;
  nameChangeCount?: number;
  neonId?: string;
  hideGender?: boolean;
  backgroundPlay?: boolean;
  locale?: string;
  notificationPrefs?: {
    marketing?: boolean;
    onlineStatus?: boolean;
    newFollowers?: boolean;
  };
  privacyConsent?: {
    necessary?: boolean;
    analytics?: boolean;
    advertising?: boolean;
    marketing?: boolean;
  };
  blockedUsers?: string[];
  blockedUserMeta?: Record<string, { name?: string; photo?: string }>;
  claimedPromoCodes?: string[];
  chatUnlocks?: { date: string; used: number };
  unlockedChats?: string[];
  items?: Array<{
    id: string;
    type: string;
    label: string;
    expiresAt: string;
  }>;
  youneonBadge?: boolean;
  reportsReceivedCount?: number;
  lastReportedAt?: unknown;
  successfulChats?: number;
  createdAt?: Date | unknown;
  updatedAt?: unknown;
  lastProfileUpdate?: unknown;
}

export interface ChatMessage {
  id?: string; conversationId: string; senderId: string;
  text?: string; imageBase64?: string; timestamp?: Date;
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const FREE_CALL_INTERVAL_MS = TWENTY_FOUR_HOURS_MS;
export const PAID_CALL_COST = 20;

export const saveUserProfile = async (profile: UserProfile) => {
  const { neonBalance: _neon, premiumUntil: _until, lastPaymentId: _pay, ...rest } = profile;
  const ref = doc(db, "users", profile.piUsername);
  await setDoc(
    ref,
    { ...rest, updatedAt: Timestamp.now(), lastProfileUpdate: Timestamp.now() },
    { merge: true }
  );
  return profile.piUsername;
};

export const getUserProfile = async (piUsername: string) => {
  const ref = doc(db, "users", piUsername);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() } as UserProfile;
  return null;
};

export const subscribeToUserProfile = (
  userId: string,
  cb: (profile: UserProfile | null) => void
) => {
  if (!userId || userId === "anon") {
    cb(null);
    return () => {};
  }
  const ref = doc(db, "users", userId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      cb({ id: snap.id, ...(snap.data() as object) } as UserProfile);
    },
    () => cb(null)
  );
};

/** All-time gifts received. Call when a gift is successfully sent to this user. */
export const incrementGiftsReceived = async (
  recipientUserId: string,
  meta?: {
    fromId?: string;
    fromName?: string;
    fromPhoto?: string;
    giftId?: string;
    giftEmoji?: string;
  }
) => {
  if (!recipientUserId || recipientUserId === "anon") return;
  try {
    const reactionKey = meta?.giftId ? GIFT_TO_REACTION[meta.giftId] : undefined;
    await setDoc(
      doc(db, "users", recipientUserId),
      {
        giftsReceivedCount: increment(1),
        updatedAt: Timestamp.now(),
        ...(reactionKey ? { [`reactionsReceived.${reactionKey}`]: increment(1) } : {}),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("incrementGiftsReceived failed", e);
  }
  if (meta?.fromId || meta?.fromName) {
    const { notifyGiftReceived } = await import("@/lib/notifications");
    void notifyGiftReceived({
      recipientId: recipientUserId,
      actorId: meta.fromId,
      actorName: meta.fromName,
      actorPhoto: meta.fromPhoto,
      giftId: meta.giftId,
      giftEmoji: meta.giftEmoji,
    });
  }
};

export const getConversationId = (a: string, b: string) => [a, b].sort().join("__");

export const conversationExists = async (a: string, b: string) => {
  if (!a || !b) return false;
  const snap = await getDoc(doc(db, "conversations", getConversationId(a, b)));
  return snap.exists();
};

export const getOrCreateConversation = async (
  me: { id: string; name: string; avatar: string; flag?: string; photo?: string },
  other: { id: string; name: string; avatar: string; flag?: string; photo?: string }
) => {
  const cid = getConversationId(me.id, other.id);
  const ref = doc(db, "conversations", cid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [me.id, other.id],
      participantNames: { [me.id]: me.name, [other.id]: other.name },
      participantAvatars: { [me.id]: me.avatar, [other.id]: other.avatar },
      participantPhotos: { [me.id]: me.photo || "", [other.id]: other.photo || "" },
      participantFlags: { [me.id]: me.flag || "", [other.id]: other.flag || "" },
      lastMessage: "", lastMessageTime: serverTimestamp(),
      unreadCount: { [me.id]: 0, [other.id]: 0 },
      lastReadAt: {},
      lastCallAt: {},
      unlocked: false,
      unlockedBy: "",
      createdAt: serverTimestamp(),
    });
  } else {
    // Keep avatar/photo fresh for current user (in case they updated their profile)
    const updates: any = {
      [`participantNames.${me.id}`]: me.name,
      [`participantAvatars.${me.id}`]: me.avatar,
      [`participantPhotos.${me.id}`]: me.photo || "",
      [`participantFlags.${me.id}`]: me.flag || "",
    };
    await updateDoc(ref, updates);
  }
  return cid;
};

export const subscribeToConversation = (
  conversationId: string,
  cb: (conv: any | null) => void
) => {
  const ref = doc(db, "conversations", conversationId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...snap.data() });
  });
};

export const unlockConversation = async (
  conversationId: string,
  unlockerUserId: string
) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    unlocked: true,
    unlockedBy: unlockerUserId,
    unlockedAt: serverTimestamp(),
  });
};

// Returns 0 if free (>24h since last call OR never called), else PAID_CALL_COST
export const getCallCost = (conv: any | null, currentUserId: string): number => {
  if (!conv) return 0;
  const lastCallTs = conv.lastCallAt?.[currentUserId];
  if (!lastCallTs) return 0;
  const lastMs = lastCallTs.toMillis ? lastCallTs.toMillis() : new Date(lastCallTs).getTime();
  if (Date.now() - lastMs >= FREE_CALL_INTERVAL_MS) return 0;
  return PAID_CALL_COST;
};

export const recordCall = async (conversationId: string, userId: string) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    [`lastCallAt.${userId}`]: serverTimestamp(),
  });
};

export const sendChatMessage = async (
  conversationId: string, senderId: string, text?: string, imageBase64?: string
) => {
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    senderId, text: text || "", imageBase64: imageBase64 || "", timestamp: serverTimestamp(),
  });
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const recipient = (data.participants as string[]).find((p) => p !== senderId);
    const currentUnread = (data.unreadCount && data.unreadCount[recipient!]) || 0;
    const preview = text || (imageBase64 ? "📷 Image" : "");
    await updateDoc(ref, {
      lastMessage: preview,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${recipient}`]: currentUnread + 1,
    });
    if (recipient) {
      const names = (data.participantNames || {}) as Record<string, string>;
      const photos = (data.participantPhotos || {}) as Record<string, string>;
      const avatars = (data.participantAvatars || {}) as Record<string, string>;
      const { notifyNewMessage } = await import("@/lib/notifications");
      void notifyNewMessage({
        recipientId: recipient,
        actorId: senderId,
        actorName: names[senderId] || senderId,
        actorPhoto: photos[senderId] || avatars[senderId] || "",
        conversationId,
        preview,
      });
    }
  }
};

export const subscribeToMessages = (conversationId: string, cb: (msgs: ChatMessage[]) => void) => {
  const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("timestamp", "asc"));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => {
      const data = d.data() as any;
      return { id: d.id, conversationId, senderId: data.senderId, text: data.text,
        imageBase64: data.imageBase64, timestamp: data.timestamp?.toDate() } as ChatMessage;
    });
    cb(msgs);
  });
};

// Delete messages older than 48 hours when the conversation has been read.
// "Read" means the user (or other participant) opened the chat at least once after the message.
export const cleanupOldReadMessages = async (conversationId: string) => {
  try {
    const convRef = doc(db, "conversations", conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) return;
    const conv = convSnap.data() as any;
    const lastReadMap = conv.lastReadAt || {};
    const readTimes: number[] = Object.values(lastReadMap)
      .map((v: any) => (v?.toMillis ? v.toMillis() : 0))
      .filter((n: number) => n > 0);
    if (readTimes.length === 0) return;
    const latestRead = Math.max(...readTimes);
    const cutoffMs = Math.min(Date.now() - FORTY_EIGHT_HOURS_MS, latestRead - FORTY_EIGHT_HOURS_MS);

    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const snap = await getDocs(msgsRef);
    const dels: Promise<any>[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : 0;
      if (ts && ts < cutoffMs) {
        dels.push(deleteDoc(d.ref));
      }
    });
    await Promise.all(dels);
  } catch (e) {
    console.warn("cleanupOldReadMessages failed:", e);
  }
};

export const subscribeToConversations = (userId: string, cb: (convs: any[]) => void) => {
  const q = query(collection(db, "conversations"), where("participants", "array-contains", userId));
  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    convs.sort((a: any, b: any) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));
    cb(convs);
  });
};

export const markConversationAsRead = async (conversationId: string, userId: string) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    [`unreadCount.${userId}`]: 0,
    [`lastReadAt.${userId}`]: serverTimestamp(),
  });
};

export const addToHistory = async (
  currentUserId: string,
  match: {
    id: string;
    name: string;
    avatar: string;
    flag?: string;
    duration?: string;
    durationSeconds?: number;
    photo?: string;
    gender?: string;
    country?: string;
    languages?: string[];
  }
) => {
  const durationSeconds =
    typeof match.durationSeconds === "number" && Number.isFinite(match.durationSeconds)
      ? Math.max(0, Math.floor(match.durationSeconds))
      : null;
  await addDoc(collection(db, "users", currentUserId, "history"), {
    matchId: match.id,
    name: match.name,
    avatar: match.avatar,
    photo: match.photo || "",
    countryFlag: match.flag || "",
    country: match.country || "",
    gender: match.gender || "",
    languages: Array.isArray(match.languages) ? match.languages : [],
    duration: match.duration || "Random video chat",
    durationSeconds,
    timestamp: serverTimestamp(),
  });
  if (durationSeconds != null && durationSeconds >= 30) {
    try {
      await setDoc(
        doc(db, "users", currentUserId),
        { successfulChats: increment(1), updatedAt: Timestamp.now() },
        { merge: true }
      );
      const { refreshYouNeonBadge } = await import("@/lib/safety");
      void refreshYouNeonBadge(currentUserId);
    } catch {
      /* ignore */
    }
  }
};

export const subscribeToHistory = (userId: string, cb: (items: any[]) => void) => {
  const q = query(collection(db, "users", userId, "history"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
};

export default {};
