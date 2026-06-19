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
    if (!isAuthenticated || isLit || isSubmitting) {
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
      aria-label={isLit ? "この投稿は灯しています" : "この投稿を灯す"}
      aria-pressed={isLit}
      disabled={!isAuthenticated || isLit || isSubmitting}
      onClick={handleClick}
    >
      {isLit ? "灯した" : "灯す"} {count}
    </button>
  );
}
