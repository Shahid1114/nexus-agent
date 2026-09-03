import { db } from "@/db";
import { sql } from "drizzle-orm";

let ready: Promise<void> | null = null;

/**
 * Creates the required tables if they don't exist yet.
 * This means a freshly deployed app "just works" with only a
 * DATABASE_URL — no manual `drizzle-kit push` step required.
 * Runs once per server instance (memoized).
 */
export function ensureSchema(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        status TEXT NOT NULL DEFAULT 'planning',
        summary TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS steps (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        idx INTEGER NOT NULL,
        title TEXT NOT NULL,
        detail TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'done'
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS deliverables (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'markdown',
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
  })().catch((e) => {
    ready = null; // allow retry on next request if it failed
    throw e;
  });
  return ready;
}
