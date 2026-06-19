"use client";

import { useState } from "react";

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

export function NotificationPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadNotifications() {
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
        setMessage(data.error ?? "通知を確認できませんでした。");
        return;
      }

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="notificationPanel" aria-label="届いた灯りの一覧">
      <div className="notificationActions">
        <button type="button" onClick={loadNotifications} disabled={isLoading}>
          {isLoading ? "確認中" : hasLoaded ? "もう一度確認" : "確認する"}
        </button>
        {hasLoaded && unreadCount > 0 ? (
          <button type="button" onClick={markRead} disabled={isLoading}>
            既読にする
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="formError" role="alert">
          {message}
        </p>
      ) : null}

      {hasLoaded && !message ? (
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
            <p>まだお知らせはありません。</p>
          </div>
        )
      ) : null}
    </section>
  );
}
