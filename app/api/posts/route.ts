import { NextResponse, type NextRequest } from "next/server";
import { requireRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import { createPost, listNewestPosts } from "@/lib/db/repositories";
import { maxPostBodyLength, parsePostBody } from "@/lib/posts/validation";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export function GET() {
  const database = openDatabase();

  try {
    return NextResponse.json({ posts: listNewestPosts(database) });
  } finally {
    database.close();
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "create-post", { limit: 12, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const auth = requireRequestUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const body = parsePostBody(await request.json().catch(() => null));

  if (!body) {
    return NextResponse.json(
      { error: `投稿本文は1〜${maxPostBodyLength}文字で入力してください。` },
      { status: 400 }
    );
  }

  const database = openDatabase();

  try {
    const postId = createPost(database, { userId: auth.user.id, body });

    return NextResponse.json({ post: { id: postId, body } }, { status: 201 });
  } finally {
    database.close();
  }
}
