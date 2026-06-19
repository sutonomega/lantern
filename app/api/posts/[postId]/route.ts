import { NextResponse, type NextRequest } from "next/server";
import { requireRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import { deletePost, updatePostBody } from "@/lib/db/repositories";
import { maxPostBodyLength, parsePostBody } from "@/lib/posts/validation";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const limited = rateLimit(request, "edit-post", { limit: 20, windowMs: 60_000 });

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

  const body = parsePostBody(await request.json().catch(() => null));

  if (!body) {
    return NextResponse.json(
      { error: `投稿本文は1〜${maxPostBodyLength}文字で入力してください。` },
      { status: 400 }
    );
  }

  const database = openDatabase();

  try {
    const updated = updatePostBody(database, { postId, userId: auth.user.id, body });

    if (!updated) {
      return NextResponse.json({ error: "自分の投稿だけ編集できます。" }, { status: 403 });
    }

    return NextResponse.json({ post: { id: postId, body } });
  } finally {
    database.close();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const limited = rateLimit(request, "delete-post", { limit: 20, windowMs: 60_000 });

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
    const deleted = deletePost(database, { postId, userId: auth.user.id });

    if (!deleted) {
      return NextResponse.json({ error: "自分の投稿だけ削除できます。" }, { status: 403 });
    }

    return NextResponse.json({ deleted: true });
  } finally {
    database.close();
  }
}
