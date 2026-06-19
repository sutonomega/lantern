import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(readFileSync("lib/db/schema.sql", "utf8"));
  return database;
}

test("users, posts, and lights can be created with duplicate lights prevented", () => {
  const database = createDatabase();

  try {
    const userId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("test_user", "hash").lastInsertRowid;
    const postId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "静かなテスト投稿").lastInsertRowid;

    database.prepare("INSERT OR IGNORE INTO lights (user_id, post_id) VALUES (?, ?)").run(userId, postId);
    database.prepare("INSERT OR IGNORE INTO lights (user_id, post_id) VALUES (?, ?)").run(userId, postId);

    const lightCount = database
      .prepare("SELECT COUNT(*) AS count FROM lights WHERE post_id = ?")
      .get(postId).count;

    assert.equal(lightCount, 1);
  } finally {
    database.close();
  }
});

test("lights can be toggled off by deleting the viewer light", () => {
  const database = createDatabase();

  try {
    const userId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("toggle_user", "hash").lastInsertRowid;
    const postId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "灯りを戻すテスト").lastInsertRowid;

    database.prepare("INSERT INTO lights (user_id, post_id) VALUES (?, ?)").run(userId, postId);
    const deleteResult = database
      .prepare("DELETE FROM lights WHERE user_id = ? AND post_id = ?")
      .run(userId, postId);
    const lightCount = database
      .prepare("SELECT COUNT(*) AS count FROM lights WHERE post_id = ?")
      .get(postId).count;

    assert.equal(deleteResult.changes, 1);
    assert.equal(lightCount, 0);
  } finally {
    database.close();
  }
});

test("hidden posts are excluded for the viewer who hid them", () => {
  const database = createDatabase();

  try {
    const userId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("viewer", "hash").lastInsertRowid;
    const postId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "非表示のテスト投稿").lastInsertRowid;

    database.prepare("INSERT INTO hidden_posts (user_id, post_id) VALUES (?, ?)").run(userId, postId);

    const visiblePost = database
      .prepare(
        `
        SELECT posts.id
        FROM posts
        WHERE NOT EXISTS (
          SELECT 1
          FROM hidden_posts
          WHERE hidden_posts.post_id = posts.id
            AND hidden_posts.user_id = ?
        )
      `
      )
      .get(userId);

    assert.equal(visiblePost, undefined);
  } finally {
    database.close();
  }
});

test("search can exclude hidden posts for the viewer", () => {
  const database = createDatabase();

  try {
    const userId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("search_viewer", "hash").lastInsertRowid;
    const visiblePostId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "検索できる投稿").lastInsertRowid;
    const hiddenPostId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "検索できるけれど非表示の投稿").lastInsertRowid;

    database
      .prepare("INSERT INTO hidden_posts (user_id, post_id) VALUES (?, ?)")
      .run(userId, hiddenPostId);

    const rows = database
      .prepare(
        `
        SELECT posts.id
        FROM posts
        WHERE
          posts.body LIKE ?
          AND NOT EXISTS (
            SELECT 1
            FROM hidden_posts
            WHERE hidden_posts.post_id = posts.id
              AND hidden_posts.user_id = ?
          )
        ORDER BY posts.id
      `
      )
      .all("%検索%", userId);

    assert.deepEqual(
      rows.map((row) => row.id),
      [visiblePostId]
    );
  } finally {
    database.close();
  }
});

test("discover ordering excludes hidden posts without using light count ranking", () => {
  const database = createDatabase();

  try {
    const userId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("discover_viewer", "hash").lastInsertRowid;
    const visiblePostId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "見つけられる投稿").lastInsertRowid;
    const hiddenPostId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(userId, "見つけない投稿").lastInsertRowid;

    database.prepare("INSERT INTO hidden_posts (user_id, post_id) VALUES (?, ?)").run(userId, hiddenPostId);
    database.prepare("INSERT INTO lights (user_id, post_id) VALUES (?, ?)").run(userId, visiblePostId);

    const rows = database
      .prepare(
        `
        SELECT
          posts.id,
          COUNT(lights.id) AS light_count
        FROM posts
        LEFT JOIN lights ON lights.post_id = posts.id
        WHERE
          NOT EXISTS (
            SELECT 1
            FROM hidden_posts
            WHERE hidden_posts.post_id = posts.id
              AND hidden_posts.user_id = ?
          )
        GROUP BY posts.id
        ORDER BY ((posts.id * 1103515245 + strftime('%Y%j', 'now')) & 2147483647), posts.id DESC
      `
      )
      .all(userId);

    assert.deepEqual(
      rows.map((row) => row.id),
      [visiblePostId]
    );
  } finally {
    database.close();
  }
});

test("light notifications are created for post owners except self lights", () => {
  const database = createDatabase();

  try {
    const ownerId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("owner", "hash").lastInsertRowid;
    const actorId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("actor", "hash").lastInsertRowid;
    const postId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(ownerId, "通知される投稿").lastInsertRowid;

    database
      .prepare("INSERT OR IGNORE INTO notifications (user_id, actor_user_id, post_id, type) VALUES (?, ?, ?, 'light')")
      .run(ownerId, actorId, postId);
    database
      .prepare("INSERT OR IGNORE INTO notifications (user_id, actor_user_id, post_id, type) VALUES (?, ?, ?, 'light')")
      .run(ownerId, actorId, postId);

    const notificationCount = database
      .prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ?")
      .get(ownerId).count;

    assert.equal(notificationCount, 1);
  } finally {
    database.close();
  }
});

test("only the owner can update a post body", () => {
  const database = createDatabase();

  try {
    const ownerId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("edit_owner", "hash").lastInsertRowid;
    const otherId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("edit_other", "hash").lastInsertRowid;
    const postId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(ownerId, "編集前").lastInsertRowid;

    const otherResult = database
      .prepare("UPDATE posts SET body = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL")
      .run("他人の編集", postId, otherId);
    const ownerResult = database
      .prepare("UPDATE posts SET body = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL")
      .run("編集後", postId, ownerId);
    const post = database.prepare("SELECT body FROM posts WHERE id = ?").get(postId);

    assert.equal(otherResult.changes, 0);
    assert.equal(ownerResult.changes, 1);
    assert.equal(post.body, "編集後");
  } finally {
    database.close();
  }
});

test("only the owner can soft delete a post", () => {
  const database = createDatabase();

  try {
    const ownerId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("delete_owner", "hash").lastInsertRowid;
    const otherId = database
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run("delete_other", "hash").lastInsertRowid;
    const postId = database
      .prepare("INSERT INTO posts (user_id, body) VALUES (?, ?)")
      .run(ownerId, "削除前").lastInsertRowid;

    const otherResult = database
      .prepare(
        "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
      )
      .run(postId, otherId);
    const ownerResult = database
      .prepare(
        "UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
      )
      .run(postId, ownerId);
    const post = database.prepare("SELECT deleted_at FROM posts WHERE id = ?").get(postId);

    assert.equal(otherResult.changes, 0);
    assert.equal(ownerResult.changes, 1);
    assert.notEqual(post.deleted_at, null);
  } finally {
    database.close();
  }
});
