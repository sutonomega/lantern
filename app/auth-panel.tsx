"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";

export function AuthPanel({ initialUser }: { initialUser: { username: string } | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "認証できませんでした。");
        return;
      }

      setUsername("");
      setPassword("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    setError("");
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (initialUser) {
    return (
      <section className="authPanel" aria-label="ログイン状態">
        <div>
          <p className="authStatus">ログイン中</p>
          <strong>{initialUser.username}</strong>
        </div>
        <button type="button" onClick={logout} disabled={isSubmitting}>
          ログアウト
        </button>
      </section>
    );
  }

  return (
    <section className="authPanel" aria-label="認証">
      <form className="authForm" onSubmit={submitAuth}>
        <div className="authMode" role="group" aria-label="認証モード">
          <button
            type="button"
            aria-pressed={mode === "login"}
            onClick={() => setMode("login")}
          >
            アカウントを使う
          </button>
          <button
            type="button"
            aria-pressed={mode === "register"}
            onClick={() => setMode("register")}
          >
            はじめて登録
          </button>
        </div>

        <label>
          username
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="demo_user"
            required
          />
        </label>

        <label>
          password
          <input
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8文字以上"
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中" : mode === "login" ? "ログイン" : "登録してログイン"}
        </button>

        {error ? (
          <p className="formError" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
