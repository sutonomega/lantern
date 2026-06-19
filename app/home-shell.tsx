"use client";

import { useState } from "react";
import { AppMenu } from "@/app/app-menu";
import { AuthPanel } from "@/app/auth-panel";
import { PostCard, type DisplayPost } from "@/app/post-card";
import { PostComposer } from "@/app/post-composer";

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
        <div className="brand">
          <span className="brandLantern" aria-hidden="true" />
          <span>Lantern</span>
        </div>
        <div className="actions" aria-label="主要操作">
          <button
            type="button"
            className="primaryAction"
            aria-expanded={isComposerOpen}
            aria-controls="compose"
            onClick={() => setIsComposerOpen((current) => !current)}
          >
            {isComposerOpen ? "閉じる" : "灯りを置く"}
          </button>
          <AppMenu />
        </div>
      </header>

      <AuthPanel initialUser={initialUser} />

      {isComposerOpen ? (
        <section className="composePanel" id="compose" aria-labelledby="compose-title">
          <div>
            <h2 id="compose-title">いま置いておきたい一言</h2>
            <p>
              {isAuthenticated
                ? "あなたの一言を新しいランタンとして置きます。"
                : "灯りを置くには登録またはログインが必要です。"}
            </p>
          </div>
          <PostComposer isAuthenticated={isAuthenticated} />
        </section>
      ) : null}

      <section className="feed" id="feed" aria-labelledby="feed-title">
        <div className="sectionHeading">
          <h2 id="feed-title">新しいランタン</h2>
          <p>気になるランタンに灯りをつけましょう。</p>
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
