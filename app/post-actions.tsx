"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PostActions({
  postId,
  isAuthenticated
}: {
  postId: number;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(action: "hide" | "report") {
    if (!isAuthenticated || isSubmitting) {
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/${action}`, { method: "POST" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setMessage(data.error ?? "操作できませんでした。");
        return;
      }

      setMessage(action === "hide" ? "非表示にしました。" : "通報しました。");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="postActions">
      <button
        type="button"
        disabled={!isAuthenticated || isSubmitting}
        onClick={() => runAction("hide")}
      >
        非表示
      </button>
      <button
        type="button"
        disabled={!isAuthenticated || isSubmitting}
        onClick={() => runAction("report")}
      >
        通報
      </button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
