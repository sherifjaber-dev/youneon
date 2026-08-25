/**
 * One-shot admin cleanup of clearly marked test/demo/seed Firestore docs.
 *
 * Deletes ONLY:
 *   - docs with isTest / isDemo / seed / isSeed / demo / test === true
 *   - reserved fake ids: guest_demo, pi_user, anon, test_*, demo_*, mock_*, seed_*
 *   - display names exactly like "Test User" or "Guest (demo)"
 *
 * Collections scanned: users, presence, matchQueue, conversations, follows, notifications
 * (plus users/{id}/history for deleted fake users).
 *
 * Does NOT mass-delete real Pi accounts.
 *
 * Run from repo root (needs Firebase Admin credentials, never commit .env.local):
 *   node scripts/cleanup-test-users.mjs
 *
 * If this machine cannot reach production Firestore, use Firebase Console:
 *   1. Firestore → presence — delete docs whose id or userId is guest_demo / pi_user / anon / test_* / demo_*
 *      or fields isTest / isDemo / seed are true.
 *   2. Firestore → matchQueue — same filters.
 *   3. Firestore → users — delete ONLY those same marked/fake ids (do not wipe the collection).
 *   4. Firestore → conversations — delete docs with those flags, or participants including fake ids.
 */

const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

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

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

function readServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const parsed = JSON.parse(json);
    if (parsed.client_email && parsed.private_key) {
      return {
        projectId: parsed.project_id || process.env.FIREBASE_PROJECT_ID || "youneon",
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
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
  "mock_sofia",
  "mock_liam",
  "sofia_demo",
  "liam_demo",
  "seed_sofia",
  "seed_liam",
  "current_user_id",
]);
const FAKE_NAME_RE = /^(test(\s*user)?|guest(\s*\(demo\))?|demo(\s*user)?)$/i;
const FAKE_ID_PREFIX_RE = /^(test|demo|mock|seed|guest)([_-]|$)/i;

function isReservedFakeId(id) {
  const value = String(id || "").trim().toLowerCase();
  if (!value) return true;
  return RESERVED.has(value) || FAKE_ID_PREFIX_RE.test(value);
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

function isFakeUserRecord(id, data) {
  const rec = data || {};
  if (recordHasDemoFlag(rec)) return true;
  const userId = String(rec.userId || rec.piUsername || rec.uid || id || "").trim();
  if (isReservedFakeId(userId) && isReservedFakeId(id)) return true;
  if (isReservedFakeId(id) || isReservedFakeId(userId)) return true;
  const name = String(rec.fullName || rec.displayName || rec.name || rec.nickname || "").trim();
  return FAKE_NAME_RE.test(name);
}

async function main() {
  const account = readServiceAccount();
  if (!account) {
    console.error(
      "No Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
    );
    console.error("This machine cannot wipe production Firestore without those keys.");
    console.error("Use Firebase Console on presence and matchQueue (and only marked users) instead.");
    process.exit(1);
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
  usersSnap.forEach((doc) => {
    if (isFakeUserRecord(doc.id, doc.data())) {
      fakeUserIds.push(doc.id);
      userRefs.push(doc.ref);
    }
  });
  for (const userId of fakeUserIds) {
    const historySnap = await db.collection("users").doc(userId).collection("history").get();
    counts.history += await flush(historySnap.docs.map((d) => d.ref));
  }
  counts.users = await flush(userRefs);

  const presenceSnap = await db.collection("presence").get();
  counts.presence = await flush(
    presenceSnap.docs.filter((d) => isFakeUserRecord(d.id, d.data()) || recordHasDemoFlag(d.data())).map((d) => d.ref)
  );

  const queueSnap = await db.collection("matchQueue").get();
  counts.matchQueue = await flush(
    queueSnap.docs.filter((d) => isFakeUserRecord(d.id, d.data()) || recordHasDemoFlag(d.data())).map((d) => d.ref)
  );

  const convSnap = await db.collection("conversations").get();
  counts.conversations = await flush(
    convSnap.docs
      .filter((d) => {
        const data = d.data() || {};
        const participants = Array.isArray(data.participants) ? data.participants.map(String) : [];
        return recordHasDemoFlag(data) || participants.some((p) => isReservedFakeId(p)) || isFakeUserRecord(d.id, data);
      })
      .map((d) => d.ref)
  );

  const followSnap = await db.collection("follows").get();
  counts.follows = await flush(
    followSnap.docs
      .filter((d) => {
        const data = d.data() || {};
        return (
          recordHasDemoFlag(data) ||
          isReservedFakeId(data.followerId) ||
          isReservedFakeId(data.followedId) ||
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
          isReservedFakeId(data.actorId) ||
          fakeUserIds.includes(String(data.recipientId || "")) ||
          fakeUserIds.includes(String(data.actorId || ""))
        );
      })
      .map((d) => d.ref)
  );

  console.log("Cleanup complete (marked test/demo/seed only):");
  console.log(counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
