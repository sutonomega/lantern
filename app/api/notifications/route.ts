import { NextResponse, type NextRequest } from "next/server";
import { requireRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import {
  countUnreadNotifications,
  listNotifications,
  markNotificationsRead
} from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const auth = requireRequestUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const database = openDatabase();

  try {
    return NextResponse.json({
      notifications: listNotifications(database, auth.user.id),
      unreadCount: countUnreadNotifications(database, auth.user.id)
    });
  } finally {
    database.close();
  }
}

export function PATCH(request: NextRequest) {
  const limited = rateLimit(request, "read-notifications", { limit: 30, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const auth = requireRequestUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const database = openDatabase();

  try {
    markNotificationsRead(database, auth.user.id);

    return NextResponse.json({ ok: true });
  } finally {
    database.close();
  }
}
