import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-pi-auth";
import { searchAdminUsers } from "@/lib/admin-moderation";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const q = request.nextUrl.searchParams.get("q") || "";
  try {
    const users = await searchAdminUsers(q);
    return NextResponse.json({ users });
  } catch (error) {
    console.warn("[admin/users]", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
