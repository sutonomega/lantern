import { NextResponse, type NextRequest } from "next/server";
import { requireRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import { hidePost, postExists } from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const limited = rateLimit(request, "hide-post", { limit: 30, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const auth = requireRequestUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const { postId: postIdValue } = await context.params;
  const postId = Number(postIdValue);

  if (!Number.isInteger(postId) || postId < 1) {
    return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
  }

  const database = openDatabase();

  try {
    if (!postExists(database, postId)) {
      return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
    }

    hidePost(database, { userId: auth.user.id, postId });

    return NextResponse.json({ hidden: true });
  } finally {
    database.close();
  }
}
