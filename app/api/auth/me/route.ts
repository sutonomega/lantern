import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const user = getRequestUser(request);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
