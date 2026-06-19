import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import { discoverPosts } from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const limited = rateLimit(request, "discover-posts", { limit: 30, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const user = getRequestUser(request);
  const database = openDatabase();

  try {
    return NextResponse.json({
      posts: discoverPosts(database, { viewerId: user?.id })
    });
  } finally {
    database.close();
  }
}
