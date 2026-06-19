"use client";

import { useState } from "react";
import { AuthPanel } from "@/app/auth-panel";
import { NotificationPanel } from "@/app/notification-panel";
import { PostCard, type DisplayPost } from "@/app/post-card";
import { PostComposer } from "@/app/post-composer";
import { SearchPanel } from "@/app/search-panel";

export function HomeShell({
  initialUser,
  posts
}: {
  initialUser: { username: string } | null;
  posts: DisplayPost[];
}) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const isAuthenticated = Boolean(initialUser);

  return (
    <main className="appShell">
      <header className="topBar" aria-label="Lantern">
        <div>
          <p className="eyebrow">Lantern</p>
          <h1>新しいランタン</h1>
        </div>
        <div className="actions" aria-label="主要操作">
          <button
            type="button"
            className="primaryAction"
            aria-expanded={isComposerOpen}
            aria-controls="compose"
            onClick={() => setIsComposerOpen((current) => !current)}
          >
            {isComposerOpen ? "閉じる" : "投稿する"}
          </button>
        </div>
      </header>

      <AuthPanel initialUser={initialUser} />

      {isComposerOpen ? (
        <section className="composePanel" id="compose" aria-labelledby="compose-title">
          <div>
            <h2 id="compose-title">いま置いておきたい一言</h2>
            <p>
              {isAuthenticated
                ? "投稿者名は公開せず、短い言葉だけを新着に置きます。"
                : "投稿するには登録またはログインが必要です。"}
            </p>
          </div>
          <PostComposer isAuthenticated={isAuthenticated} />
        </section>
      ) : null}

      <NotificationPanel isAuthenticated={isAuthenticated} />

      <SearchPanel isAuthenticated={isAuthenticated} />

      <section className="feed" id="feed" aria-labelledby="feed-title">
        <div className="sectionHeading">
          <h2 id="feed-title">新しいランタン</h2>
          <p>投稿ランタンに灯りをつけましょう。</p>
        </div>

        {posts.length > 0 ? (
          <div className="postList">
            {posts.map((post) => (
              <PostCard post={post} isAuthenticated={isAuthenticated} key={post.id} />
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <p>まだ投稿はありません。最初の灯りを置いてください。</p>
          </div>
        )}
      </section>
    </main>
  );
}
