import { cookies } from "next/headers";
import { sessionCookieName, findSessionUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";

export type CurrentUser = {
  id: number;
  username: string;
} | null;

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(sessionCookieName)?.value;

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
