"use client";

import { useState } from "react";
import { PostCard, type DisplayPost } from "@/app/post-card";

type DiscoverPost = Omit<DisplayPost, "formattedTime">;

function formatPostTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function DiscoverPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [message, setMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadDiscoverPosts() {
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/posts/discover");
      const data = (await response.json()) as { posts?: DiscoverPost[]; error?: string };

      if (!response.ok) {
        setPosts([]);
        setMessage(data.error ?? "読み込めませんでした。");
        return;
      }

      setPosts(data.posts ?? []);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="discoverPanel" aria-labelledby="discover-title">
      <div className="sectionHeading">
        <div>
          <h2 id="discover-title">日替わりで見つける</h2>
          <p>投稿時刻や人気順ではなく、日替わりの並びで少しだけ表示します。</p>
        </div>
        <button type="button" onClick={loadDiscoverPosts} disabled={isLoading}>
          {isLoading ? "読込中" : hasLoaded ? "もう一度見る" : "日替わりを見る"}
        </button>
      </div>

      {message ? (
        <p className="formError" role="alert">
          {message}
        </p>
      ) : null}

      {hasLoaded && !message ? (
        posts.length > 0 ? (
          <div className="postList discoverResults">
            {posts.map((post) => (
              <PostCard
                post={{ ...post, formattedTime: formatPostTime(post.created_at) }}
                isAuthenticated={isAuthenticated}
                key={post.id}
              />
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <p>日替わりで表示できる投稿がまだありません。</p>
          </div>
        )
      ) : null}
    </section>
  );
}
