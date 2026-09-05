import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// A task is a single instruction the user gives to the agent.
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  category: text("category").notNull().default("general"),
  status: text("status").notNull().default("planning"), // planning | running | completed | failed
  summary: text("summary").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Steps are the agent's execution plan for a task.
export const steps = pgTable("steps", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  idx: integer("idx").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  status: text("status").notNull().default("done"), // pending | running | done
});

// Deliverables are the concrete outputs the agent produced.
export const deliverables = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("markdown"), // markdown | email | html | list | code
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type Step = typeof steps.$inferSelect;
export type Deliverable = typeof deliverables.$inferSelect;
