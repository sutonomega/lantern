import { NextResponse, type NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { attachSessionCookie, createSession } from "@/lib/auth/session";
import { parseAuthInput } from "@/lib/auth/validation";
import { openDatabase } from "@/lib/db/client";
import { createUser, findUserByUsername } from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth-register", { limit: 8, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const input = parseAuthInput(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json(
      { error: "username は3〜24文字の英数字と _、password は8〜128文字で入力してください。" },
      { status: 400 }
    );
  }

  const database = openDatabase();

  try {
    if (findUserByUsername(database, input.username)) {
      return NextResponse.json({ error: "この username は使えません。" }, { status: 409 });
    }

    const userId = createUser(database, {
      username: input.username,
      passwordHash: hashPassword(input.password)
    });
    const session = createSession(database, userId);
    const response = NextResponse.json({ user: { id: userId, username: input.username } });

    attachSessionCookie(response, session.sessionId, session.expiresAt);

    return response;
  } finally {
    database.close();
  }
}
