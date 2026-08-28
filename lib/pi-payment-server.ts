import {
  fetchPiMe,
  getPiAccessTokenFromCookie,
  parseVerifiedPiUser,
} from "@/lib/pi-session";
import {
  grantNeonPackIfNeeded,
  grantPremiumIfNeeded,
  isNeonPackPayment,
  isSubscriptionPayment,
  type PremiumGrantResult,
} from "@/lib/pi-entitlements";
import {
  approvePiPayment,
  cancelPiPayment,
  completePiPayment,
  describePiApiFailure,
  getPiPayment,
  isAlreadyApprovedPayload,
  isAlreadyCompletedPayload,
  listIncompletePaymentsWithProductionKey,
  parsePaymentId,
  parseTxid,
  piPaymentDebugMeta,
  type PiKeySource,
} from "@/lib/pi-platform";
import type { PiPaymentDTO } from "@/lib/pi-types";

export type PaymentActionResult = {
  ok: boolean;
  status: number;
  payment: PiPaymentDTO | null;
  error?: string;
  grant?: PremiumGrantResult;
  approved?: boolean;
  cancelled?: boolean;
  waiting?: boolean;
  piStatus?: number;
  headerMode?: "Key" | "Bearer";
  keySource?: PiKeySource;
};

async function sessionUsername(): Promise<string | null> {
  try {
    const token = await getPiAccessTokenFromCookie();
    if (!token) return null;
    const me = await fetchPiMe(token);
    if (!me.ok) return null;
    const user = await parseVerifiedPiUser(me);
    return user?.username || null;
  } catch {
    return null;
  }
}

async function grantFromPayment(
  payment: PiPaymentDTO | null,
  usernameHint?: string | null
): Promise<PremiumGrantResult | undefined> {
  if (!payment) return undefined;
  try {
    const username = (await sessionUsername()) || (typeof usernameHint === "string" ? usernameHint.trim() : "") || null;
    if (isSubscriptionPayment(payment)) {
      return await grantPremiumIfNeeded(payment, username);
    }
    if (isNeonPackPayment(payment)) {
      return await grantNeonPackIfNeeded(payment, username);
    }
    return undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : "grant failed";
    console.warn("[Pi] entitlement grant failed", error);
    return {
      granted: false,
      alreadyGranted: false,
      premiumUntil: null,
      neonGranted: 0,
      skipped: `grant_failed: ${message}`,
    };
  }
}

/** In-process: do not re-hit Pi approve for the same 404/401/403 paymentId. */
const deadApprovePaymentIds = new Set<string>();

function isDeadApproveStatus(status: number): boolean {
  return status === 404 || status === 401 || status === 403;
}

export async function approvePaymentById(
  paymentIdRaw: unknown,
  sandbox = false
): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }

  const debug = piPaymentDebugMeta(sandbox);
  if (deadApprovePaymentIds.has(paymentId)) {
    console.warn("[Pi] approve skipped (dead paymentId)", { paymentId, ...debug });
    await listIncompletePaymentsWithProductionKey(paymentId, sandbox);
    return {
      ok: false,
      status: 404,
      payment: null,
      piStatus: 404,
      error: describePiApiFailure("approve", 404, null, sandbox),
    };
  }

  // Always POST /approve immediately. Do not GET first — delayed approve expires the wallet.
  console.info("[Pi] approve start", {
    paymentId,
    hasProductionKey: debug.hasProductionKey,
    keyPrefix: debug.keyPrefix,
    keyLength: debug.keyLength,
    keyStartsWithSkLive: debug.keyStartsWithSkLive,
    sandbox: debug.sandbox,
    keySource: debug.keySource,
  });
  const approved = await approvePiPayment(paymentId, sandbox);
  console.info("[Pi] approve HTTP", {
    paymentId,
    hasProductionKey: debug.hasProductionKey,
    keyPrefix: debug.keyPrefix,
    keyLength: debug.keyLength,
    keyStartsWithSkLive: debug.keyStartsWithSkLive,
    headerMode: approved.headerMode,
    status: approved.status,
    piBodyText: approved.bodyText,
    sandbox: debug.sandbox,
    piUrl: approved.url,
    keySource: approved.keySource,
  });

  if (
    approved.ok ||
    approved.data?.status?.developer_approved ||
    isAlreadyApprovedPayload(approved.data)
  ) {
    return {
      ok: true,
      status: 200,
      payment: approved.data,
      approved: true,
      piStatus: approved.status,
      headerMode: approved.headerMode,
      keySource: approved.keySource,
    };
  }

  if (isDeadApproveStatus(approved.status)) {
    // Confirmed 404/401/403 with PRODUCTION — do not retry this paymentId every 10s.
    // Do not GET /payments/{id}: Open App ids from the pinet wrapper always 404 here.
    deadApprovePaymentIds.add(paymentId);
    return {
      ok: false,
      status: approved.status || 502,
      payment: approved.data,
      piStatus: approved.status,
      headerMode: approved.headerMode,
      keySource: approved.keySource,
      error: describePiApiFailure("approve", approved.status || 502, approved.data, sandbox),
    };
  }

  // Do not GET /v2/payments/{paymentId} after approve — it delays the wallet and
  // always 404s for Open App payments created on youneonbq9219.pinet.com.
  return {
    ok: false,
    status: approved.status || 502,
    payment: approved.data,
    piStatus: approved.status,
    headerMode: approved.headerMode,
    keySource: approved.keySource,
    error: describePiApiFailure("approve", approved.status || 502, approved.data, sandbox),
  };
}

export async function completePaymentById(
  paymentIdRaw: unknown,
  txidRaw: unknown,
  usernameHint?: string | null,
  sandbox = false
): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  const txid = parseTxid(txidRaw);
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }
  if (!txid) {
    return { ok: false, status: 400, payment: null, error: "txid is required" };
  }

  const debug = piPaymentDebugMeta(sandbox);
  console.info("[Pi] complete start", {
    paymentId,
    txidLength: txid.length,
    ...debug,
  });

  // Official order: approve (no txid), then complete with txid.
  // Do not GET first — that extra round-trip expired wallets. Approve is idempotent.
  try {
    const approved = await approvePiPayment(paymentId, sandbox);
    if (
      !approved.ok &&
      !approved.data?.status?.developer_approved &&
      !isAlreadyApprovedPayload(approved.data)
    ) {
      console.warn("[Pi] complete: approve before complete failed", {
        paymentId,
        status: approved.status,
        ...debug,
      });
    }
  } catch (error) {
    console.warn("[Pi] complete: approve before complete failed", {
      paymentId,
      message: error instanceof Error ? error.message : "approve failed",
      ...debug,
    });
  }

  // Always POST /complete with { txid } — even if get/approve failed or Neon was already granted.
  const completed = await completePiPayment(paymentId, txid, sandbox);
  console.info("[Pi] complete HTTP", {
    paymentId,
    txidLength: txid.length,
    status: completed.status,
    ...debug,
  });
  const alreadyDone =
    completed.status === 200 ||
    isAlreadyCompletedPayload(completed.data) ||
    completed.data?.status?.developer_completed === true;

  if (completed.status === 200) {
    const grant = await grantFromPayment(completed.data, usernameHint);
    return {
      ok: true,
      status: 200,
      piStatus: 200,
      payment: completed.data,
      grant,
    };
  }

  if (alreadyDone) {
    const payment =
      completed.data ||
      (await getPiPayment(paymentId, sandbox)).data ||
      null;
    const grant = await grantFromPayment(payment, usernameHint);
    return {
      ok: true,
      status: 200,
      piStatus: completed.status,
      payment,
      grant,
    };
  }

  return {
    ok: false,
    status: completed.status || 502,
    piStatus: completed.status,
    payment: completed.data,
    error: describePiApiFailure("complete", completed.status || 502, completed.data, sandbox),
  };
}

export async function cancelPaymentById(
  paymentIdRaw: unknown,
  sandbox = false
): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }

  const current = await getPiPayment(paymentId, sandbox);
  if (current.data?.status?.developer_completed) {
    const grant = await grantFromPayment(current.data);
    return { ok: true, status: 200, payment: current.data, grant };
  }
  if (current.data?.status?.cancelled || current.data?.status?.user_cancelled) {
    return { ok: true, status: 200, payment: current.data, cancelled: true };
  }

  const cancelled = await cancelPiPayment(paymentId, sandbox);
  if (!cancelled.ok) {
    return {
      ok: false,
      status: cancelled.status || 502,
      payment: cancelled.data,
      error: describePiApiFailure("cancel", cancelled.status || 502, cancelled.data, sandbox),
    };
  }
  return { ok: true, status: 200, payment: cancelled.data, cancelled: true };
}

/**
 * Resolve a payment that Pi SDK reported as incomplete.
 * With a blockchain txid: complete (and grant). Without a txid: cancel so the next buy can proceed.
 */
export async function resolveIncompletePayment(
  paymentIdRaw: unknown,
  extra?: { txid?: unknown; payment?: PiPaymentDTO | null; username?: string | null; sandbox?: boolean }
): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }

  const sandbox = extra?.sandbox === true;
  const current = await getPiPayment(paymentId, sandbox);
  const payment = current.data || extra?.payment || null;

  if (!current.ok && !payment) {
    return {
      ok: false,
      status: current.status || 502,
      payment: null,
      error: describePiApiFailure("get payment", current.status || 502, current.data, sandbox),
    };
  }

  if (payment?.status?.cancelled || payment?.status?.user_cancelled) {
    return { ok: true, status: 200, payment, cancelled: true };
  }

  const txid =
    parseTxid(extra?.txid) ||
    parseTxid(payment?.transaction?.txid) ||
    parseTxid(extra?.payment?.transaction?.txid);

  // Always complete when a real txid exists — even if the item was already delivered.
  if (txid) {
    return completePaymentById(paymentId, txid, extra?.username, sandbox);
  }

  if (payment?.status?.developer_completed) {
    const grant = await grantFromPayment(payment, extra?.username);
    return { ok: true, status: 200, payment, grant };
  }

  const cancelled = await cancelPaymentById(paymentId, sandbox);
  if (cancelled.ok) return cancelled;

  const retry = await getPiPayment(paymentId, sandbox);
  const retryTxid = parseTxid(retry.data?.transaction?.txid);
  if (retryTxid) {
    return completePaymentById(paymentId, retryTxid, extra?.username, sandbox);
  }

  return {
    ok: false,
    status: cancelled.status || 502,
    payment: cancelled.payment || payment,
    error:
      cancelled.error ||
      "Incomplete Pi payment could not be completed or cancelled. Further purchases may stay blocked until this payment is resolved in Pi Develop.",
  };
}
