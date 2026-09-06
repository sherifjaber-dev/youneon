import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { isRealPiUsername } from "./real-pi-user";
import { LOUNGE_MAX, LOUNGE_ONLINE_MS } from "./lounge-service";

export function subscribeToOnlineCount(cb: (count: number) => void): Unsubscribe {
  if (!db) {
    cb(0);
    return () => {};
  }
  const cutoff = Timestamp.fromMillis(Date.now() - LOUNGE_ONLINE_MS);
  const presenceQuery = query(
    collection(db, "presence"),
    where("lastSeen", ">", cutoff),
    orderBy("lastSeen", "desc"),
    limit(LOUNGE_MAX)
  );
  return onSnapshot(
    presenceQuery,
    (snap) => {
      const ids = new Set<string>();
      snap.forEach((row) => {
        const id = row.id || String(row.data()?.userId || "");
        if (isRealPiUsername(id)) ids.add(id);
      });
      cb(ids.size);
    },
    () => cb(0)
  );
}

export function waitHintFromOnlineCount(count: number): string {
  if (count <= 0) return "No one waiting right now — start anyway and we’ll match the next Pioneer.";
  if (count === 1) return "1 Pioneer online · you may wait a moment.";
  if (count < 8) return `${count} online · typical wait under a minute.`;
  return `${count} online · matching should be quick.`;
}
