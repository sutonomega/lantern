import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/lib/db/client";

export const sessionCookieName = "lantern_session";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

type SessionUser = {
  id: number;
  username: string;
};

export function createSession(database: DatabaseSync, userId: number) {
  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();

  database
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sessionId, userId, expiresAt);

  return { sessionId, expiresAt };
}

export function attachSessionCookie(response: NextResponse, sessionId: string, expiresAt: string) {
  response.cookies.set(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function findSessionUser(database: DatabaseSync, sessionId: string) {
  return database
    .prepare(
      `
      SELECT users.id, users.username
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.id = ? AND datetime(sessions.expires_at) > CURRENT_TIMESTAMP
    `
    )
    .get(sessionId) as SessionUser | undefined;
}

export function deleteSession(database: DatabaseSync, sessionId: string) {
  database.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function getRequestUser(request: NextRequest) {
  const sessionId = request.cookies.get(sessionCookieName)?.value;

  if (!sessionId) {
    return null;
  }

  const database = openDatabase();

  try {
    return findSessionUser(database, sessionId) ?? null;
  } finally {
    database.close();
  }
}

export function requireRequestUser(request: NextRequest) {
  const user = getRequestUser(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 })
    };
  }

  return { user, response: null };
}
