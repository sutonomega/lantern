import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const defaultDatabasePath = resolve(process.cwd(), "lantern.sqlite");

export function getDatabasePath() {
  return resolve(process.cwd(), process.env.DATABASE_PATH ?? defaultDatabasePath);
}

export function openDatabase() {
  const databasePath = getDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");

  return database;
}

export function initializeDatabase() {
  const database = openDatabase();
  const schema = readFileSync(resolve(process.cwd(), "lib/db/schema.sql"), "utf8");
  database.exec(schema);
  database.close();
}
