"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const maxPostLength = 180;

export function PostComposer({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!body.trim()) {
      setError("投稿本文を入力してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "投稿できませんでした。");
        return;
      }

      setBody("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="composeForm" onSubmit={handleSubmit}>
      <label htmlFor="post-body">投稿本文</label>
      <textarea
        id="post-body"
        name="body"
        maxLength={maxPostLength}
        placeholder={isAuthenticated ? "短い言葉を置く" : "ログインすると投稿できます"}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={!isAuthenticated || isSubmitting}
      />
      <div className="formFooter">
        <span>
          {body.length}/{maxPostLength}
        </span>
        <button type="submit" disabled={!isAuthenticated || isSubmitting}>
          {isSubmitting ? "投稿中" : "灯りを置く"}
        </button>
      </div>
      {error ? (
        <p className="formError" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
