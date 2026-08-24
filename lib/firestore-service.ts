import {
  collection, addDoc, getDocs, getDoc, setDoc, updateDoc, doc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  id?: string;
  uid?: string;
  piUsername: string;
  fullName: string;
  age: number;
  country: string;
  languages: string[];
  interests: string[];
  avatar?: string;
  profilePicture?: string;
  createdAt?: Date;
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
  const ref = doc(db, "users", profile.piUsername);
  await setDoc(ref, { ...profile, updatedAt: Timestamp.now() }, { merge: true });
  return profile.piUsername;
};

export const getUserProfile = async (piUsername: string) => {
  const ref = doc(db, "users", piUsername);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() } as UserProfile;
  return null;
};

const getConversationId = (a: string, b: string) => [a, b].sort().join("__");

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
    await updateDoc(ref, {
      lastMessage: text || (imageBase64 ? "📷 Image" : ""),
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${recipient}`]: currentUnread + 1,
    });
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
  match: { id: string; name: string; avatar: string; flag?: string; duration?: string; photo?: string }
) => {
  await addDoc(collection(db, "users", currentUserId, "history"), {
    matchId: match.id, name: match.name, avatar: match.avatar,
    photo: match.photo || "",
    countryFlag: match.flag || "", duration: match.duration || "Random video chat",
    timestamp: serverTimestamp(),
  });
};

export const subscribeToHistory = (userId: string, cb: (items: any[]) => void) => {
  const q = query(collection(db, "users", userId, "history"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
};

export default {};
