"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LightButton } from "@/app/light-button";
import { PostActions } from "@/app/post-actions";

export type DisplayPost = {
  id: number;
  body: string;
  created_at: string;
  formattedTime: string;
  light_count: number;
  lit_by_viewer: boolean;
  is_owned_by_viewer: boolean;
};

export function PostCard({
  post,
  isAuthenticated
}: {
  post: DisplayPost;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [body, setBody] = useState(post.body);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "編集できませんでした。");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteOwnPost() {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "削除できませんでした。");
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className="postCard">
      {isEditing ? (
        <form className="editForm" onSubmit={submitEdit}>
          <label htmlFor={`edit-post-${post.id}`}>投稿本文を編集</label>
          <textarea
            id={`edit-post-${post.id}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={180}
            disabled={isSubmitting}
          />
          <div className="formFooter">
            <span>{body.length}/180</span>
            <div className="editActions">
              <button
                type="button"
                onClick={() => {
                  setBody(post.body);
                  setError("");
                  setIsEditing(false);
                }}
                disabled={isSubmitting}
              >
                やめる
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中" : "保存"}
              </button>
            </div>
          </div>
          {error ? (
            <p className="formError" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <p>{post.body}</p>
      )}
      <footer>
        <time dateTime={post.created_at}>{post.formattedTime}</time>
        <LightButton
          postId={post.id}
          initialCount={post.light_count}
          initiallyLit={post.lit_by_viewer}
          isAuthenticated={isAuthenticated}
        />
      </footer>
      {post.is_owned_by_viewer && !isEditing ? (
        <div className="ownerActions">
          <button type="button" onClick={() => setIsEditing(true)}>
            編集
          </button>
          <button type="button" onClick={deleteOwnPost} disabled={isDeleting}>
            {isDeleting ? "削除中" : "削除"}
          </button>
        </div>
      ) : null}
      {!isEditing && error ? (
        <p className="formError" role="alert">
          {error}
        </p>
      ) : null}
      <PostActions postId={post.id} isAuthenticated={isAuthenticated} />
    </article>
  );
}
