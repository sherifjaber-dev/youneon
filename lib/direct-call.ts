"use client";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DirectCallStatus = "ringing" | "accepted" | "declined" | "canceled" | "missed";

export type DirectCallInvite = {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  calleeId: string;
  calleeName?: string;
  roomKey: string;
  conversationId?: string;
  status: DirectCallStatus;
  createdAtMs: number;
};

export const DIRECT_CALL_RING_MS = 45_000;

function callDoc(userId: string, callId: string) {
  return doc(db, "users", userId, "directCalls", callId);
}

function newCallId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function placeDirectCall(opts: {
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  calleeId: string;
  calleeName?: string;
  roomKey: string;
  conversationId?: string;
}): Promise<string> {
  const id = newCallId();
  const payload: DirectCallInvite = {
    id,
    callerId: opts.callerId,
    callerName: opts.callerName,
    callerPhoto: opts.callerPhoto || "",
    calleeId: opts.calleeId,
    calleeName: opts.calleeName || "",
    roomKey: opts.roomKey,
    conversationId: opts.conversationId || opts.roomKey,
    status: "ringing",
    createdAtMs: Date.now(),
  };
  await Promise.all([
    setDoc(callDoc(opts.calleeId, id), { ...payload, createdAt: serverTimestamp() }),
    setDoc(callDoc(opts.callerId, id), { ...payload, createdAt: serverTimestamp() }),
  ]);
  return id;
}

export async function setDirectCallStatus(
  call: Pick<DirectCallInvite, "id" | "callerId" | "calleeId">,
  status: DirectCallStatus
): Promise<void> {
  const patch = { status, updatedAtMs: Date.now() };
  await Promise.all([
    updateDoc(callDoc(call.calleeId, call.id), patch).catch(() =>
      setDoc(callDoc(call.calleeId, call.id), patch, { merge: true })
    ),
    updateDoc(callDoc(call.callerId, call.id), patch).catch(() =>
      setDoc(callDoc(call.callerId, call.id), patch, { merge: true })
    ),
  ]);
}

function readInvite(id: string, data: Record<string, unknown>): DirectCallInvite {
  const createdAtMs =
    typeof data.createdAtMs === "number"
      ? data.createdAtMs
      : typeof (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis === "function"
        ? (data.createdAt as { toMillis: () => number }).toMillis()
        : Date.now();
  return {
    id,
    callerId: String(data.callerId || ""),
    callerName: String(data.callerName || "Someone"),
    callerPhoto: String(data.callerPhoto || ""),
    calleeId: String(data.calleeId || ""),
    calleeName: String(data.calleeName || ""),
    roomKey: String(data.roomKey || ""),
    conversationId: String(data.conversationId || data.roomKey || ""),
    status: (data.status as DirectCallStatus) || "ringing",
    createdAtMs,
  };
}

export function subscribeIncomingDirectCalls(
  userId: string,
  onChange: (invite: DirectCallInvite | null) => void
): () => void {
  if (!userId) {
    onChange(null);
    return () => {};
  }
  return onSnapshot(
    collection(db, "users", userId, "directCalls"),
    (snap) => {
      const now = Date.now();
      const ringing = snap.docs
        .map((d) => readInvite(d.id, d.data() as Record<string, unknown>))
        .filter(
          (c) =>
            c.status === "ringing" &&
            c.calleeId === userId &&
            c.callerId !== userId &&
            now - c.createdAtMs < DIRECT_CALL_RING_MS &&
            c.roomKey
        )
        .sort((a, b) => b.createdAtMs - a.createdAtMs)[0] || null;
      onChange(ringing);
    },
    () => onChange(null)
  );
}

export function subscribeDirectCall(
  userId: string,
  callId: string,
  onChange: (invite: DirectCallInvite | null) => void
): () => void {
  if (!userId || !callId) {
    onChange(null);
    return () => {};
  }
  return onSnapshot(
    callDoc(userId, callId),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      onChange(readInvite(snap.id, snap.data() as Record<string, unknown>));
    },
    () => onChange(null)
  );
}

let ringCtx: AudioContext | null = null;
let ringTimer: number | null = null;
let ringOsc: OscillatorNode[] = [];

function getRingCtx(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ringCtx) ringCtx = new AC();
    if (ringCtx.state === "suspended") void ringCtx.resume();
    return ringCtx;
  } catch {
    return null;
  }
}

function beepPair(ctx: AudioContext, start: number) {
  const freqs = [440, 480];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.09, start + 0.04);
    gain.gain.setValueAtTime(0.09, start + 0.85);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 1.08);
    ringOsc.push(osc);
  });
}

/** Phone-style ring. Returns a stop function. */
export function startCallRingtone(vibrate = true): () => void {
  stopCallRingtone();
  const ctx = getRingCtx();
  const pulse = () => {
    if (ctx) {
      ringOsc = [];
      beepPair(ctx, ctx.currentTime);
    }
    if (vibrate) {
      try {
        navigator.vibrate?.([900, 400]);
      } catch {
        /* ignore */
      }
    }
    ringTimer = window.setTimeout(pulse, 1600);
  };
  pulse();
  return stopCallRingtone;
}

export function stopCallRingtone(): void {
  if (ringTimer != null) {
    window.clearTimeout(ringTimer);
    ringTimer = null;
  }
  ringOsc.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
  });
  ringOsc = [];
  try {
    navigator.vibrate?.(0);
  } catch {
    /* ignore */
  }
}
