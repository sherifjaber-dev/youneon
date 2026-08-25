import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminFirestore } from "@/lib/firebase-admin";

export type AdminUserSummary = {
  id: string;
  piUsername: string;
  fullName: string;
  neonId: string;
  photo: string;
  age: number | null;
  country: string;
  neonBalance: number;
  banned: boolean;
  reportsReceivedCount: number;
  warnings: Array<{ at: string; message: string; by: string }>;
};

function userFromData(id: string, data: Record<string, unknown>): AdminUserSummary {
  const warningsRaw = Array.isArray(data.warnings) ? data.warnings : [];
  return {
    id,
    piUsername: typeof data.piUsername === "string" ? data.piUsername : id,
    fullName: typeof data.fullName === "string" ? data.fullName : id,
    neonId: typeof data.neonId === "string" ? data.neonId : "",
    photo:
      (typeof data.profilePicture === "string" && data.profilePicture) ||
      (Array.isArray(data.photos) ? String(data.photos[0] || "") : "") ||
      "",
    age: typeof data.age === "number" ? data.age : null,
    country: typeof data.country === "string" ? data.country : "",
    neonBalance: Math.max(0, Math.floor(Number(data.neonBalance || 0))),
    banned: data.banned === true,
    reportsReceivedCount: Math.max(0, Math.floor(Number(data.reportsReceivedCount || 0))),
    warnings: warningsRaw
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const rec = row as { at?: unknown; message?: unknown; by?: unknown };
        return {
          at: typeof rec.at === "string" ? rec.at : "",
          message: typeof rec.message === "string" ? rec.message : "",
          by: typeof rec.by === "string" ? rec.by : "",
        };
      })
      .filter((row): row is { at: string; message: string; by: string } => !!row),
  };
}

async function writeUser(id: string, payload: Record<string, unknown>) {
  const admin = getAdminFirestore();
  if (admin) {
    await admin.collection("users").doc(id).set(payload, { merge: true });
    return;
  }
  await setDoc(doc(db, "users", id), payload, { merge: true });
}

export async function getAdminUser(id: string): Promise<AdminUserSummary | null> {
  const admin = getAdminFirestore();
  if (admin) {
    const snap = await admin.collection("users").doc(id).get();
    if (!snap.exists) return null;
    return userFromData(snap.id, snap.data() as Record<string, unknown>);
  }
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  return userFromData(snap.id, snap.data() as Record<string, unknown>);
}

export async function searchAdminUsers(raw: string): Promise<AdminUserSummary[]> {
  const q = raw.trim();
  if (!q) return [];
  const found = new Map<string, AdminUserSummary>();
  const exact = await getAdminUser(q);
  if (exact) found.set(exact.id, exact);

  const admin = getAdminFirestore();
  const add = (id: string, data: Record<string, unknown>) => {
    found.set(id, userFromData(id, data));
  };

  if (admin) {
    const neon = await admin.collection("users").where("neonId", "==", q).limit(8).get();
    neon.forEach((d) => add(d.id, d.data() as Record<string, unknown>));
    const lower = q.toLowerCase();
    if (!exact && q.length >= 2) {
      const prefix = await admin.collection("users").orderBy("piUsername").startAt(q).endAt(`${q}\uf8ff`).limit(12).get();
      prefix.forEach((d) => add(d.id, d.data() as Record<string, unknown>));
      if (found.size === 0) {
        const scan = await admin.collection("users").limit(80).get();
        scan.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const name = String(data.fullName || d.id).toLowerCase();
          const user = String(data.piUsername || d.id).toLowerCase();
          const neonId = String(data.neonId || "").toLowerCase();
          if (name.includes(lower) || user.includes(lower) || neonId.includes(lower)) {
            add(d.id, data);
          }
        });
      }
    }
  } else {
    const neon = await getDocs(query(collection(db, "users"), where("neonId", "==", q)));
    neon.forEach((d) => add(d.id, d.data() as Record<string, unknown>));
    if (found.size === 0) {
      const scan = await getDocs(collection(db, "users"));
      const lower = q.toLowerCase();
      scan.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const name = String(data.fullName || d.id).toLowerCase();
        const user = String(data.piUsername || d.id).toLowerCase();
        const neonId = String(data.neonId || "").toLowerCase();
        if (name.includes(lower) || user.includes(lower) || neonId.includes(lower)) {
          add(d.id, data);
        }
      });
    }
  }

  return [...found.values()].slice(0, 20);
}

export async function setUserBanned(id: string, banned: boolean, by: string) {
  await writeUser(id, {
    banned,
    bannedAt: banned ? new Date().toISOString() : null,
    bannedBy: banned ? by : null,
    updatedAt: new Date(),
  });
  const admin = getAdminFirestore();
  if (admin) {
    try {
      await admin.collection("matchQueue").doc(id).delete();
    } catch {
      /* ignore */
    }
  } else {
    try {
      await deleteDoc(doc(db, "matchQueue", id));
    } catch {
      /* ignore */
    }
  }
}

export async function warnUser(id: string, message: string, by: string) {
  const user = await getAdminUser(id);
  const warnings = [
    ...(user?.warnings || []),
    { at: new Date().toISOString(), message, by },
  ];
  await writeUser(id, { warnings, updatedAt: new Date() });
  const payload = {
    recipientId: id,
    type: "warning",
    title: "Account warning",
    body: message,
    actorId: by,
    actorName: "YouNeon",
    createdAt: new Date(),
  };
  const admin = getAdminFirestore();
  if (admin) {
    await admin.collection("notifications").add(payload);
  } else {
    const { addDoc, collection: col } = await import("firebase/firestore");
    await addDoc(col(db, "notifications"), payload);
  }
}

export async function clearUserReports(id: string) {
  const admin = getAdminFirestore();
  if (admin) {
    const snap = await admin.collection("reports").where("reportedUserId", "==", id).get();
    const batch = admin.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.set(
      admin.collection("users").doc(id),
      { reportsReceivedCount: 0, lastReportedAt: null, updatedAt: new Date() },
      { merge: true }
    );
    await batch.commit();
    return snap.size;
  }
  const snap = await getDocs(query(collection(db, "reports"), where("reportedUserId", "==", id)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await setDoc(
    doc(db, "users", id),
    { reportsReceivedCount: 0, lastReportedAt: null, updatedAt: new Date() },
    { merge: true }
  );
  return snap.size;
}
