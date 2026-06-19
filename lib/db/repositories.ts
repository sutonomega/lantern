import type { DatabaseSync } from "node:sqlite";

export type UserRecord = {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
};

export type PostRecord = {
  id: number;
  body: string;
  created_at: string;
  light_count: number;
  lit_by_viewer: boolean;
  is_owned_by_viewer: boolean;
};

export type NotificationRecord = {
  id: number;
  post_id: number;
  post_body: string;
  type: string;
  read_at: string | null;
  created_at: string;
};

export function createUser(
  database: DatabaseSync,
  input: { username: string; passwordHash: string }
) {
  const result = database
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(input.username, input.passwordHash);

  return Number(result.lastInsertRowid);
}

export function findUserByUsername(database: DatabaseSync, username: string) {
  return database
    .prepare("SELECT id, username, password_hash, created_at FROM users WHERE username = ?")
    .get(username) as UserRecord | undefined;
}

export function createPost(database: DatabaseSync, input: { userId: number; body: string }) {
  const result = database
    .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
    .run(input.userId, input.body.trim());

  return Number(result.lastInsertRowid);
}

type RawPostRecord = Omit<PostRecord, "lit_by_viewer" | "is_owned_by_viewer"> & {
  lit_by_viewer: number;
  is_owned_by_viewer: number;
};

export function listNewestPosts(database: DatabaseSync, limit = 30, viewerId?: number) {
  const viewerKey = viewerId ?? -1;
  const rows = database
    .prepare(
      `
      SELECT
        posts.id,
        posts.body,
        posts.created_at,
        COUNT(lights.id) AS light_count,
        MAX(CASE WHEN lights.user_id = ? THEN 1 ELSE 0 END) AS lit_by_viewer,
        CASE WHEN posts.user_id = ? THEN 1 ELSE 0 END AS is_owned_by_viewer
      FROM posts
      LEFT JOIN lights ON lights.post_id = posts.id
      WHERE
        posts.deleted_at IS NULL
        AND (
          ? < 1
          OR NOT EXISTS (
            SELECT 1
            FROM hidden_posts
            WHERE hidden_posts.post_id = posts.id
              AND hidden_posts.user_id = ?
          )
        )
      GROUP BY posts.id
      ORDER BY posts.created_at DESC, posts.id DESC
      LIMIT ?
    `
    )
    .all(viewerKey, viewerKey, viewerKey, viewerKey, limit) as RawPostRecord[];

  return rows.map((row) => ({
    ...row,
    lit_by_viewer: Boolean(row.lit_by_viewer),
    is_owned_by_viewer: Boolean(row.is_owned_by_viewer)
  }));
}

function escapeLikePattern(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export function searchPosts(
  database: DatabaseSync,
  input: { query: string; limit?: number; viewerId?: number }
) {
  const viewerKey = input.viewerId ?? -1;
  const rows = database
    .prepare(
      `
      SELECT
        posts.id,
        posts.body,
        posts.created_at,
        COUNT(lights.id) AS light_count,
        MAX(CASE WHEN lights.user_id = ? THEN 1 ELSE 0 END) AS lit_by_viewer,
        CASE WHEN posts.user_id = ? THEN 1 ELSE 0 END AS is_owned_by_viewer
      FROM posts
      LEFT JOIN lights ON lights.post_id = posts.id
      WHERE
        posts.deleted_at IS NULL
        AND posts.body LIKE ? ESCAPE '\\'
        AND (
          ? < 1
          OR NOT EXISTS (
            SELECT 1
            FROM hidden_posts
            WHERE hidden_posts.post_id = posts.id
              AND hidden_posts.user_id = ?
          )
        )
      GROUP BY posts.id
      ORDER BY posts.created_at DESC, posts.id DESC
      LIMIT ?
    `
    )
    .all(
      viewerKey,
      viewerKey,
      `%${escapeLikePattern(input.query)}%`,
      viewerKey,
      viewerKey,
      input.limit ?? 30
    ) as RawPostRecord[];

  return rows.map((row) => ({
    ...row,
    lit_by_viewer: Boolean(row.lit_by_viewer),
    is_owned_by_viewer: Boolean(row.is_owned_by_viewer)
  }));
}

export function discoverPosts(database: DatabaseSync, input: { limit?: number; viewerId?: number }) {
  const viewerKey = input.viewerId ?? -1;
  const rows = database
    .prepare(
      `
      SELECT
        posts.id,
        posts.body,
        posts.created_at,
        COUNT(lights.id) AS light_count,
        MAX(CASE WHEN lights.user_id = ? THEN 1 ELSE 0 END) AS lit_by_viewer,
        CASE WHEN posts.user_id = ? THEN 1 ELSE 0 END AS is_owned_by_viewer
      FROM posts
      LEFT JOIN lights ON lights.post_id = posts.id
      WHERE
        posts.deleted_at IS NULL
        AND (
          ? < 1
          OR NOT EXISTS (
            SELECT 1
            FROM hidden_posts
            WHERE hidden_posts.post_id = posts.id
              AND hidden_posts.user_id = ?
          )
        )
      GROUP BY posts.id
      ORDER BY ((posts.id * 1103515245 + strftime('%Y%j', 'now')) & 2147483647), posts.id DESC
      LIMIT ?
    `
    )
    .all(viewerKey, viewerKey, viewerKey, viewerKey, input.limit ?? 5) as RawPostRecord[];

  return rows.map((row) => ({
    ...row,
    lit_by_viewer: Boolean(row.lit_by_viewer),
    is_owned_by_viewer: Boolean(row.is_owned_by_viewer)
  }));
}

export function postExists(database: DatabaseSync, postId: number) {
  const row = database
    .prepare("SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL")
    .get(postId) as { id: number } | undefined;

  return Boolean(row);
}

export function findPostOwner(database: DatabaseSync, postId: number) {
  return database
    .prepare("SELECT user_id FROM posts WHERE id = ? AND deleted_at IS NULL")
    .get(postId) as { user_id: number } | undefined;
}

export function updatePostBody(
  database: DatabaseSync,
  input: { postId: number; userId: number; body: string }
) {
  const result = database
    .prepare("UPDATE posts SET body = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL")
    .run(input.body.trim(), input.postId, input.userId);

  return result.changes > 0;
}

export function deletePost(database: DatabaseSync, input: { postId: number; userId: number }) {
  const result = database
    .prepare(
      "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
    )
    .run(input.postId, input.userId);

  return result.changes > 0;
}

export function createLight(database: DatabaseSync, input: { userId: number; postId: number }) {
  const result = database
    .prepare("INSERT OR IGNORE INTO lights (user_id, post_id) VALUES (?, ?)")
    .run(input.userId, input.postId);

  return result.changes > 0;
}

export function deleteLight(database: DatabaseSync, input: { userId: number; postId: number }) {
  const result = database
    .prepare("DELETE FROM lights WHERE user_id = ? AND post_id = ?")
    .run(input.userId, input.postId);

  return result.changes > 0;
}

export function createLightNotification(
  database: DatabaseSync,
  input: { userId: number; actorUserId: number; postId: number }
) {
  if (input.userId === input.actorUserId) {
    return;
  }

  database
    .prepare(
      `
      INSERT OR IGNORE INTO notifications (user_id, actor_user_id, post_id, type)
      VALUES (?, ?, ?, 'light')
    `
    )
    .run(input.userId, input.actorUserId, input.postId);
}

export function listNotifications(database: DatabaseSync, userId: number, limit = 10) {
  return database
    .prepare(
      `
      SELECT
        notifications.id,
        notifications.post_id,
        posts.body AS post_body,
        notifications.type,
        notifications.read_at,
        notifications.created_at
      FROM notifications
      INNER JOIN posts ON posts.id = notifications.post_id
      WHERE notifications.user_id = ?
        AND posts.deleted_at IS NULL
      ORDER BY notifications.created_at DESC, notifications.id DESC
      LIMIT ?
    `
    )
    .all(userId, limit) as NotificationRecord[];
}

export function countUnreadNotifications(database: DatabaseSync, userId: number) {
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL")
    .get(userId) as { count: number };

  return row.count;
}

export function markNotificationsRead(database: DatabaseSync, userId: number) {
  database
    .prepare("UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL")
    .run(userId);
}

export function countLights(database: DatabaseSync, postId: number) {
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM lights WHERE post_id = ?")
    .get(postId) as { count: number };

  return row.count;
}

export function hidePost(database: DatabaseSync, input: { userId: number; postId: number }) {
  database
    .prepare("INSERT OR IGNORE INTO hidden_posts (user_id, post_id) VALUES (?, ?)")
    .run(input.userId, input.postId);
}

export function reportPost(
  database: DatabaseSync,
  input: { userId: number; postId: number; reason?: string }
) {
  database
    .prepare("INSERT OR IGNORE INTO reports (user_id, post_id, reason) VALUES (?, ?, ?)")
    .run(input.userId, input.postId, input.reason ?? null);
}
