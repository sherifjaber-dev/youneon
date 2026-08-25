import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-pi-auth";
import { clearUserReports, setUserBanned, warnUser } from "@/lib/admin-moderation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing user." }, { status: 400 });
  let body: { action?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  try {
    if (action === "ban") {
      await setUserBanned(id, true, auth.user.username);
      return NextResponse.json({ ok: true, banned: true });
    }
    if (action === "unban") {
      await setUserBanned(id, false, auth.user.username);
      return NextResponse.json({ ok: true, banned: false });
    }
    if (action === "warn") {
      const message =
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim().slice(0, 400)
          : "Your account received a warning from YouNeon Safety.";
      await warnUser(id, message, auth.user.username);
      return NextResponse.json({ ok: true });
    }
    if (action === "clear-reports") {
      const removed = await clearUserReports(id);
      return NextResponse.json({ ok: true, removed });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.warn("[admin/user]", error);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
