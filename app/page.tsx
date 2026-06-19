import { cookies } from "next/headers";
import { HomeShell } from "@/app/home-shell";
import { findSessionUser, sessionCookieName } from "@/lib/auth/session";
import { openDatabase } from "@/lib/db/client";
import { listNewestPosts } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

function formatPostTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function Home() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(sessionCookieName)?.value;
  const database = openDatabase();

  try {
    const user = sessionId ? findSessionUser(database, sessionId) : null;
    const posts = listNewestPosts(database, 30, user?.id);

    return (
      <HomeShell
        initialUser={user ? { username: user.username } : null}
        posts={posts.map((post) => ({
          ...post,
          formattedTime: formatPostTime(post.created_at)
        }))}
      />
    );
  } finally {
    database.close();
  }
}
