import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, deleteSession, sessionCookieName } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(sessionCookieName)?.value;
  const response = NextResponse.json({ ok: true });

  if (sessionId) {
    const database = openDatabase();

    try {
      deleteSession(database, sessionId);
    } finally {
      database.close();
    }
  }

  clearSessionCookie(response);

  return response;
}
