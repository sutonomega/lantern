"use client";

import { FormEvent, useState } from "react";
import { PostCard, type DisplayPost } from "@/app/post-card";

type SearchPost = Omit<DisplayPost, "formattedTime">;

function formatPostTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function SearchPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSearching(true);

    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { posts?: SearchPost[]; error?: string };

      if (!response.ok) {
        setPosts([]);
        setMessage(data.error ?? "検索できませんでした。");
        return;
      }

      setPosts(data.posts ?? []);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className="searchPanel" aria-label="検索フォーム">
      <form className="searchForm" onSubmit={handleSubmit}>
        <input
          id="search-query"
          name="q"
          aria-label="検索語"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="探したい言葉"
          maxLength={40}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? "検索中" : "検索"}
        </button>
      </form>

      {message ? (
        <p className="formError" role="alert">
          {message}
        </p>
      ) : null}

      {hasSearched && !message ? (
        posts.length > 0 ? (
          <div className="postList searchResults">
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
            <p>該当する投稿はありません。</p>
          </div>
        )
      ) : null}
    </section>
  );
}
