import { NextResponse, type NextRequest } from "next/server";
import { requireRequestUser } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import {
  countLights,
  createLight,
  createLightNotification,
  deleteLight,
  findPostOwner,
  postExists
} from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const limited = rateLimit(request, "light-post", { limit: 60, windowMs: 60_000 });

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

    const created = createLight(database, { userId: auth.user.id, postId });

    if (created) {
      const owner = findPostOwner(database, postId);

      if (owner) {
        createLightNotification(database, {
          userId: owner.user_id,
          actorUserId: auth.user.id,
          postId
        });
      }

      return NextResponse.json({
        lit: true,
        lightCount: countLights(database, postId)
      });
    }

    deleteLight(database, { userId: auth.user.id, postId });

    return NextResponse.json({
      lit: false,
      lightCount: countLights(database, postId)
    });
  } finally {
    database.close();
  }
}
