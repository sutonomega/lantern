"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LightButton({
  postId,
  initialCount,
  initiallyLit,
  isAuthenticated
}: {
  postId: number;
  initialCount: number;
  initiallyLit: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [isLit, setIsLit] = useState(initiallyLit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (!isAuthenticated || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/lights`, { method: "POST" });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { lightCount: number; lit: boolean };
      setCount(data.lightCount);
      setIsLit(data.lit);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      className="lightButton"
      aria-label={isLit ? "この投稿の灯りを取り消す" : "この投稿を灯す"}
      aria-pressed={isLit}
      disabled={!isAuthenticated || isSubmitting}
      onClick={handleClick}
    >
      <span className="lightButtonIcon" aria-hidden="true" />
      <span>{isLit ? "灯した" : "灯す"}</span>
      <span className="lightCount">{count}</span>
    </button>
  );
}
