import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.cwd(), process.env.DATABASE_PATH ?? "lantern.sqlite");
const schemaPath = resolve(process.cwd(), "lib/db/schema.sql");

mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(readFileSync(schemaPath, "utf8"));
database.close();

console.log(`SQLite database initialized: ${databasePath}`);
