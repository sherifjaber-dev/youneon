import {
  fetchPiMe,
  getPiAccessTokenFromCookie,
  parseVerifiedPiUser,
} from "@/lib/pi-session";
import { grantPremiumIfNeeded, type PremiumGrantResult } from "@/lib/pi-entitlements";
import {
  approvePiPayment,
  completePiPayment,
  getPiPayment,
  parsePaymentId,
} from "@/lib/pi-platform";
import type { PiPaymentDTO } from "@/lib/pi-types";

export type PaymentActionResult = {
  ok: boolean;
  status: number;
  payment: PiPaymentDTO | null;
  error?: string;
  grant?: PremiumGrantResult;
  approved?: boolean;
  waiting?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function grantFromPayment(payment: PiPaymentDTO | null): Promise<PremiumGrantResult | undefined> {
  if (!payment) return undefined;
  try {
    const username = await sessionUsername();
    return await grantPremiumIfNeeded(payment, username);
  } catch (error) {
    console.warn("[Pi] entitlement grant failed", error);
    return undefined;
  }
}

export async function approvePaymentById(paymentIdRaw: unknown): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }

  const current = await getPiPayment(paymentId);
  if (current.ok && current.data?.status?.developer_approved) {
    return { ok: true, status: 200, payment: current.data, approved: true };
  }

  const approved = await approvePiPayment(paymentId);
  if (!approved.ok) {
    const already = await getPiPayment(paymentId);
    if (already.ok && already.data?.status?.developer_approved) {
      return { ok: true, status: 200, payment: already.data, approved: true };
    }
    return {
      ok: false,
      status: approved.status || 502,
      payment: approved.data,
      error: "Pi approve failed",
    };
  }

  return { ok: true, status: 200, payment: approved.data, approved: true };
}

export async function completePaymentById(
  paymentIdRaw: unknown,
  txidRaw: unknown
): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  const txid = typeof txidRaw === "string" ? txidRaw.trim() : "";
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }
  if (!txid) {
    return { ok: false, status: 400, payment: null, error: "txid is required" };
  }

  const current = await getPiPayment(paymentId);
  if (current.ok && current.data?.status?.developer_completed) {
    const grant = await grantFromPayment(current.data);
    return { ok: true, status: 200, payment: current.data, grant };
  }

  if (!current.data?.status?.developer_approved) {
    const approved = await approvePiPayment(paymentId);
    if (!approved.ok && !current.data?.status?.developer_approved) {
      console.warn("[Pi] complete: approve before complete failed", paymentId);
    }
  }

  const completed = await completePiPayment(paymentId, txid);
  if (!completed.ok) {
    return {
      ok: false,
      status: completed.status || 502,
      payment: completed.data,
      error: "Pi complete failed",
    };
  }

  const grant = await grantFromPayment(completed.data);
  return { ok: true, status: 200, payment: completed.data, grant };
}

export async function resolveIncompletePayment(
  paymentIdRaw: unknown
): Promise<PaymentActionResult> {
  const paymentId = parsePaymentId(paymentIdRaw);
  if (!paymentId) {
    return { ok: false, status: 400, payment: null, error: "paymentId is required" };
  }

  const current = await getPiPayment(paymentId);
  if (!current.ok || !current.data) {
    return {
      ok: false,
      status: current.status || 502,
      payment: current.data,
      error: "Could not load Pi payment",
    };
  }

  const payment = current.data;
  if (payment.status?.cancelled || payment.status?.user_cancelled) {
    return { ok: true, status: 200, payment };
  }

  if (payment.status?.developer_completed) {
    const grant = await grantFromPayment(payment);
    return { ok: true, status: 200, payment, grant };
  }

  const existingTxid = payment.transaction?.txid;
  if (existingTxid) {
    return completePaymentById(paymentId, existingTxid);
  }

  if (!payment.status?.developer_approved) {
    const approved = await approvePaymentById(paymentId);
    if (!approved.ok) return approved;

    for (let i = 0; i < 3; i++) {
      await sleep(1000);
      const again = await getPiPayment(paymentId);
      const txid = again.data?.transaction?.txid;
      if (txid) {
        return completePaymentById(paymentId, txid);
      }
    }

    return { ok: true, status: 200, payment: approved.payment, approved: true, waiting: true };
  }

  return { ok: true, status: 200, payment, waiting: true };
}
