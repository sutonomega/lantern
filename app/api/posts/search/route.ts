import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import { searchPosts } from "@/lib/db/repositories";
import { maxSearchQueryLength, parseSearchQuery } from "@/lib/posts/validation";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const limited = rateLimit(request, "search-posts", { limit: 30, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const query = parseSearchQuery(request.nextUrl.searchParams.get("q"));

  if (!query) {
    return NextResponse.json(
      { error: `検索語は1〜${maxSearchQueryLength}文字で入力してください。` },
      { status: 400 }
    );
  }

  const user = getRequestUser(request);
  const database = openDatabase();

  try {
    return NextResponse.json({
      posts: searchPosts(database, { query, viewerId: user?.id })
    });
  } finally {
    database.close();
  }
}
