import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-pi-auth";
import { cleanupMarkedTestData } from "@/lib/admin-cleanup-test-data";

/**
 * One-shot admin cleanup of test/demo/seed Firestore docs.
 * Does not mass-delete real Pi users.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await cleanupMarkedTestData();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cleanup failed.";
    console.warn("[admin/cleanup-test-data]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
