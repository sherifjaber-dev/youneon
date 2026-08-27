/**
 * Cleanup seeded History / Messages / follows and marked test/demo docs.
 *
 * Deletes:
 *   - user docs named Lucas/Marcus/Sofia/Liam or reserved fake ids (guest_*, demo_*, anon, …)
 *   - history / conversations / follows / notifications involving those peers
 *   - launch-test threads for bgrlt0428 and helinxi6789 (not their user docs)
 *
 * Never deletes Sherifjaber.
 *
 *   node scripts/cleanup-test-users.mjs
 *
 * Prefers FIREBASE_SERVICE_ACCOUNT. If those keys are missing, falls back to the
 * public Firebase client (rules currently allow writes) and only deletes matching docs.
 */

import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp as initClient } from "firebase/app";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  updateDoc,
  getFirestore as getClientFirestore,
} from "firebase/firestore";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq < 1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile(resolve(ROOT, ".env.local"));
loadEnvFile(resolve(ROOT, ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

function readServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id || process.env.FIREBASE_PROJECT_ID || "youneon",
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        };
      }
    } catch {
      /* fall through to split fields */
    }
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || "youneon",
    clientEmail,
    privateKey,
  };
}

const RESERVED = new Set([
  "anon",
  "pi_user",
  "guest_demo",
  "guest",
  "demo",
  "demo_user",
  "test",
  "test_user",
  "testuser",
  "lucas",
  "marcus",
  "sofia",
  "liam",
  "mock_sofia",
  "mock_liam",
  "sofia_demo",
  "liam_demo",
  "seed_sofia",
  "seed_liam",
  "demo_luna",
  "current_user_id",
]);
const SEEDED_NAMES = new Set(["lucas", "marcus", "sofia", "liam"]);
const LAUNCH_TEST = new Set(["bgrlt0428", "helinxi6789"]);
const PROTECTED = new Set(["sherifjaber"]);
const FAKE_NAME_RE = /^(test(\s*user)?|guest(\s*\(demo\))?|demo(\s*user)?)$/i;
const FAKE_ID_PREFIX_RE = /^(test|demo|mock|seed|guest)([_-]|$)/i;

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isProtectedPiUsername(id) {
  const value = normalizeToken(id);
  return !!value && PROTECTED.has(value);
}

function isLaunchTestUsername(id) {
  const value = normalizeToken(id);
  if (!value || PROTECTED.has(value)) return false;
  return LAUNCH_TEST.has(value);
}

function isReservedFakeId(id) {
  const value = String(id || "").trim().toLowerCase();
  if (!value) return true;
  if (PROTECTED.has(normalizeToken(value))) return false;
  if (RESERVED.has(value) || RESERVED.has(normalizeToken(value))) return true;
  return FAKE_ID_PREFIX_RE.test(value);
}

function isFakeDisplayName(name) {
  const raw = String(name || "").trim();
  if (!raw) return false;
  if (FAKE_NAME_RE.test(raw)) return true;
  const normalized = normalizeToken(raw);
  return !!normalized && SEEDED_NAMES.has(normalized);
}

function recordHasDemoFlag(data) {
  return !!(
    data &&
    (data.isTest === true ||
      data.isDemo === true ||
      data.seed === true ||
      data.isSeed === true ||
      data.demo === true ||
      data.test === true)
  );
}

function isHiddenSocialPeer(id, name) {
  if (isProtectedPiUsername(id) || isProtectedPiUsername(name)) return false;
  if (isLaunchTestUsername(id)) return true;
  if (isReservedFakeId(id)) return true;
  return isFakeDisplayName(name) || isFakeDisplayName(id);
}

function isFakeUserRecord(id, data) {
  if (isProtectedPiUsername(id)) return false;
  const rec = data || {};
  const userId = String(rec.userId || rec.piUsername || rec.uid || id || "").trim();
  if (isProtectedPiUsername(userId)) return false;
  if (isLaunchTestUsername(id) || isLaunchTestUsername(userId)) return recordHasDemoFlag(rec);
  if (recordHasDemoFlag(rec)) return true;
  if (isReservedFakeId(id) || isReservedFakeId(userId)) return true;
  const name = String(rec.fullName || rec.displayName || rec.name || rec.nickname || "").trim();
  return isFakeDisplayName(name) || isFakeDisplayName(id) || isFakeDisplayName(userId);
}

function asRecord(value) {
  return value && typeof value === "object" ? value : {};
}

const CLIENT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB48SU_Yy-ld89I0QV6_-7Y_M85NQsbB0u",
  authDomain: "youneon.firebaseapp.com",
  projectId: "youneon",
  storageBucket: "youneon.firebasestorage.app",
  messagingSenderId: "315573893051",
  appId: "1:315573893051:web:4deec001c59e8c7887f69e",
};

async function runWithClient() {
  console.log("No Firebase Admin credentials. Using public Firebase client fallback.");
  const app = initClient(CLIENT_FIREBASE_CONFIG, "youneon-cleanup-client");
  const db = getClientFirestore(app);
  const counts = {
    users: 0,
    presence: 0,
    matchQueue: 0,
    conversations: 0,
    follows: 0,
    notifications: 0,
    history: 0,
  };

  const usersSnap = await getDocs(collection(db, "users"));
  const fakeUserIds = [];
  const allUserIds = [];
  usersSnap.forEach((row) => {
    allUserIds.push(row.id);
    if (isFakeUserRecord(row.id, row.data())) fakeUserIds.push(row.id);
  });
  console.log("Will delete fake user ids:", fakeUserIds.length ? fakeUserIds.join(", ") : "(none)");

  for (const userId of allUserIds) {
    const historySnap = await getDocs(collection(db, "users", userId, "history"));
    for (const row of historySnap.docs) {
      const data = asRecord(row.data());
      const matchId = String(data.matchId || row.id || "");
      const name = String(data.name || data.fullName || "");
      if (isHiddenSocialPeer(matchId, name) || isFakeDisplayName(name)) {
        await deleteDoc(row.ref);
        counts.history += 1;
      }
    }
    const followingSnap = await getDocs(collection(db, "users", userId, "following"));
    const mapUpdates = {};
    for (const row of followingSnap.docs) {
      const data = asRecord(row.data());
      const otherId = String(data.followedId || data.id || row.id || "");
      if (isHiddenSocialPeer(otherId, String(data.followedName || data.name || ""))) {
        await deleteDoc(row.ref);
        mapUpdates[`followingMap.${otherId}`] = deleteField();
        counts.follows += 1;
      }
    }
    const followersSnap = await getDocs(collection(db, "users", userId, "followers"));
    for (const row of followersSnap.docs) {
      const data = asRecord(row.data());
      const otherId = String(data.followerId || data.id || row.id || "");
      if (isHiddenSocialPeer(otherId, String(data.followerName || data.name || ""))) {
        await deleteDoc(row.ref);
        mapUpdates[`followerMap.${otherId}`] = deleteField();
        counts.follows += 1;
      }
    }
    const viewsSnap = await getDocs(collection(db, "users", userId, "profileViews"));
    for (const row of viewsSnap.docs) {
      const data = asRecord(row.data());
      if (isHiddenSocialPeer(String(data.viewerId || row.id || ""), String(data.name || ""))) {
        await deleteDoc(row.ref);
      }
    }
    if (Object.keys(mapUpdates).length > 0) {
      await updateDoc(doc(db, "users", userId), mapUpdates).catch(() => {});
    }
  }

  for (const userId of fakeUserIds) {
    await deleteDoc(doc(db, "users", userId));
    counts.users += 1;
  }

  for (const colName of ["presence", "matchQueue"]) {
    const snap = await getDocs(collection(db, colName));
    for (const row of snap.docs) {
      const data = asRecord(row.data());
      const userId = String(data.userId || data.piUsername || row.id || "");
      const name = String(data.fullName || data.displayName || data.name || "");
      if (
        recordHasDemoFlag(data) ||
        isHiddenSocialPeer(row.id, name) ||
        isHiddenSocialPeer(userId, name) ||
        isFakeUserRecord(row.id, data)
      ) {
        await deleteDoc(row.ref);
        counts[colName] += 1;
      }
    }
  }

  const convSnap = await getDocs(collection(db, "conversations"));
  for (const row of convSnap.docs) {
    const data = asRecord(row.data());
    const participants = Array.isArray(data.participants) ? data.participants.map(String) : [];
    const names = asRecord(data.participantNames);
    const hidden = participants.some((p) => isHiddenSocialPeer(p, String(names[p] || "")));
    if (recordHasDemoFlag(data) || hidden || isFakeUserRecord(row.id, data)) {
      const msgs = await getDocs(collection(db, "conversations", row.id, "messages"));
      for (const msg of msgs.docs) await deleteDoc(msg.ref);
      await deleteDoc(row.ref);
      counts.conversations += 1;
    }
  }

  const followSnap = await getDocs(collection(db, "follows"));
  for (const row of followSnap.docs) {
    const data = asRecord(row.data());
    const followerId = String(data.followerId || "");
    const followedId = String(data.followedId || "");
    if (
      recordHasDemoFlag(data) ||
      isHiddenSocialPeer(followerId, String(data.followerName || "")) ||
      isHiddenSocialPeer(followedId, String(data.followedName || data.name || "")) ||
      fakeUserIds.includes(followerId) ||
      fakeUserIds.includes(followedId)
    ) {
      await deleteDoc(row.ref);
      counts.follows += 1;
    }
  }

  const notifSnap = await getDocs(collection(db, "notifications"));
  for (const row of notifSnap.docs) {
    const data = asRecord(row.data());
    const recipientId = String(data.recipientId || "");
    const actorId = String(data.actorId || "");
    if (
      recordHasDemoFlag(data) ||
      isReservedFakeId(recipientId) ||
      isHiddenSocialPeer(actorId, String(data.actorName || "")) ||
      fakeUserIds.includes(recipientId) ||
      fakeUserIds.includes(actorId)
    ) {
      await deleteDoc(row.ref);
      counts.notifications += 1;
    }
  }

  console.log("Client cleanup complete (seeded names + test flags; Sherifjaber kept):");
  console.log(counts);
  return counts;
}

async function main() {
  const account = readServiceAccount();
  if (!account) {
    const localEnv = existsSync(resolve(ROOT, ".env.local"));
    console.error(
      "No Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
    );
    console.error(".env.local next to the script:", localEnv ? "found" : "missing");
    console.error("Admin JSON present:", !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
    console.error("Admin email present:", !!process.env.FIREBASE_CLIENT_EMAIL);
    console.error("Admin private key present:", !!process.env.FIREBASE_PRIVATE_KEY);
    await runWithClient();
    return;
  }

  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: account.projectId,
        clientEmail: account.clientEmail,
        privateKey: account.privateKey,
      }),
      projectId: account.projectId,
    });
  const db = getFirestore(app);

  const counts = {
    users: 0,
    presence: 0,
    matchQueue: 0,
    conversations: 0,
    follows: 0,
    notifications: 0,
    history: 0,
  };

  async function flush(refs) {
    for (let i = 0; i < refs.length; i += 400) {
      const batch = db.batch();
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    return refs.length;
  }

  const usersSnap = await db.collection("users").get();
  const fakeUserIds = [];
  const userRefs = [];
  const allUserIds = [];

  usersSnap.forEach((docSnap) => {
    allUserIds.push(docSnap.id);
    if (isFakeUserRecord(docSnap.id, docSnap.data() || {})) {
      fakeUserIds.push(docSnap.id);
      userRefs.push(docSnap.ref);
    }
  });

  console.log("Will delete fake user ids:", fakeUserIds.length ? fakeUserIds.join(", ") : "(none)");
  console.log("Scanning history on", allUserIds.length, "user(s); keeping protected accounts.");

  for (const userId of allUserIds) {
    const userDoc = db.collection("users").doc(userId);
    const historySnap = await userDoc.collection("history").get();
    counts.history += await flush(
      historySnap.docs
        .filter((row) => {
          const data = row.data() || {};
          const matchId = String(data.matchId || row.id || "");
          const name = String(data.name || data.fullName || "");
          return isHiddenSocialPeer(matchId, name) || isFakeDisplayName(name);
        })
        .map((row) => row.ref)
    );
    const followingSnap = await userDoc.collection("following").get();
    counts.follows += await flush(
      followingSnap.docs
        .filter((row) => {
          const data = row.data() || {};
          const otherId = String(data.followedId || data.id || row.id || "");
          return isHiddenSocialPeer(otherId, String(data.followedName || data.name || ""));
        })
        .map((row) => row.ref)
    );
    const followersSnap = await userDoc.collection("followers").get();
    counts.follows += await flush(
      followersSnap.docs
        .filter((row) => {
          const data = row.data() || {};
          const otherId = String(data.followerId || data.id || row.id || "");
          return isHiddenSocialPeer(otherId, String(data.followerName || data.name || ""));
        })
        .map((row) => row.ref)
    );
    const viewsSnap = await userDoc.collection("profileViews").get();
    await flush(
      viewsSnap.docs
        .filter((row) => {
          const data = row.data() || {};
          return isHiddenSocialPeer(String(data.viewerId || row.id || ""), String(data.name || ""));
        })
        .map((row) => row.ref)
    );
  }

  counts.users = await flush(userRefs);

  const presenceSnap = await db.collection("presence").get();
  counts.presence = await flush(
    presenceSnap.docs
      .filter((d) => isFakeUserRecord(d.id, d.data()) || isHiddenSocialPeer(d.id) || recordHasDemoFlag(d.data()))
      .map((d) => d.ref)
  );

  const queueSnap = await db.collection("matchQueue").get();
  counts.matchQueue = await flush(
    queueSnap.docs
      .filter((d) => isFakeUserRecord(d.id, d.data()) || isHiddenSocialPeer(d.id) || recordHasDemoFlag(d.data()))
      .map((d) => d.ref)
  );

  const convSnap = await db.collection("conversations").get();
  const convRefs = [];
  for (const d of convSnap.docs) {
    const data = d.data() || {};
    const participants = Array.isArray(data.participants) ? data.participants.map(String) : [];
    const names = data.participantNames || {};
    const hidden = participants.some((p) => isHiddenSocialPeer(p, String(names[p] || "")));
    if (recordHasDemoFlag(data) || hidden || isFakeUserRecord(d.id, data)) {
      const msgs = await d.ref.collection("messages").get();
      await flush(msgs.docs.map((m) => m.ref));
      convRefs.push(d.ref);
    }
  }
  counts.conversations = await flush(convRefs);

  const followSnap = await db.collection("follows").get();
  counts.follows += await flush(
    followSnap.docs
      .filter((d) => {
        const data = d.data() || {};
        return (
          recordHasDemoFlag(data) ||
          isHiddenSocialPeer(String(data.followerId || ""), String(data.followerName || "")) ||
          isHiddenSocialPeer(String(data.followedId || ""), String(data.followedName || data.name || "")) ||
          fakeUserIds.includes(String(data.followerId || "")) ||
          fakeUserIds.includes(String(data.followedId || ""))
        );
      })
      .map((d) => d.ref)
  );

  const notifSnap = await db.collection("notifications").get();
  counts.notifications = await flush(
    notifSnap.docs
      .filter((d) => {
        const data = d.data() || {};
        return (
          recordHasDemoFlag(data) ||
          isReservedFakeId(data.recipientId) ||
          isHiddenSocialPeer(String(data.actorId || ""), String(data.actorName || "")) ||
          fakeUserIds.includes(String(data.recipientId || "")) ||
          fakeUserIds.includes(String(data.actorId || ""))
        );
      })
      .map((d) => d.ref)
  );

  console.log("Cleanup complete (seeded names + test flags; Sherifjaber kept):");
  console.log(counts);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
