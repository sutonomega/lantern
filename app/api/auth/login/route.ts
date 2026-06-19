import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { attachSessionCookie, createSession } from "@/lib/auth/session";
import { parseAuthInput } from "@/lib/auth/validation";
import { openDatabase } from "@/lib/db/client";
import { findUserByUsername } from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth-login", { limit: 12, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const input = parseAuthInput(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json({ error: "username と password を確認してください。" }, { status: 400 });
  }

  const database = openDatabase();

  try {
    const user = findUserByUsername(database, input.username);

    if (!user || !verifyPassword(input.password, user.password_hash)) {
      return NextResponse.json({ error: "username または password が違います。" }, { status: 401 });
    }

    const session = createSession(database, user.id);
    const response = NextResponse.json({ user: { id: user.id, username: user.username } });

    attachSessionCookie(response, session.sessionId, session.expiresAt);

    return response;
  } finally {
    database.close();
  }
}
