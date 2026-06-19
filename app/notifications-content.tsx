"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthPanel } from "@/app/auth-panel";

type Notification = {
  id: number;
  post_id: number;
  post_body: string;
  type: string;
  read_at: string | null;
  created_at: string;
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function NotificationsContent({
  initialUser
}: {
  initialUser: { username: string } | null;
}) {
  const isAuthenticated = Boolean(initialUser);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications");
      const data = (await response.json()) as {
        notifications?: Notification[];
        unreadCount?: number;
        error?: string;
      };

      if (!response.ok) {
        setMessage(data.error ?? "届いた灯りを確認できませんでした。");
        return;
      }

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  async function markRead() {
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setMessage(data.error ?? "既読にできませんでした。");
        return;
      }

      setUnreadCount(0);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? new Date().toISOString()
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="notificationsTop">
        <AuthPanel initialUser={initialUser} />

        {isAuthenticated ? (
          <div className="notificationActions" aria-label="届いた灯りの操作">
            <button type="button" onClick={loadNotifications} disabled={isLoading}>
              {isLoading ? "更新中" : "更新"}
            </button>
            {hasLoaded && unreadCount > 0 ? (
              <button type="button" onClick={markRead} disabled={isLoading}>
                既読にする
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="pageIntro" aria-labelledby="notifications-page-title">
        <h1 id="notifications-page-title">届いた灯り</h1>
        <p>あなたのランタンに灯りがついた時だけ、ここに届きます。</p>
      </section>

      <section className="notificationPanel" aria-label="届いた灯りの一覧">
        {!isAuthenticated ? (
          <div className="emptyState">
            <p>届いた灯りを確認するにはログインしてください。</p>
          </div>
        ) : null}

        {message ? (
          <p className="formError" role="alert">
            {message}
          </p>
        ) : null}

        {isAuthenticated && hasLoaded && !message ? (
          notifications.length > 0 ? (
            <div className="notificationList">
              <p className="notificationCount">未読 {unreadCount}</p>
              {notifications.map((notification) => (
                <article className="notificationItem" key={notification.id}>
                  <p>
                    あなたのランタンに灯りがつきました。
                    {notification.read_at ? "" : " 未読です。"}
                  </p>
                  <blockquote>{notification.post_body}</blockquote>
                  <time dateTime={notification.created_at}>
                    {formatNotificationTime(notification.created_at)}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyState">
              <p>まだ届いた灯りはありません。</p>
            </div>
          )
        ) : null}
      </section>
    </>
  );
}
