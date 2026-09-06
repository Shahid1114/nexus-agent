import { db } from "@/db";
import { tasks, steps, deliverables } from "@/db/schema";
import { runAgent } from "@/lib/agent";
import { ensureSchema } from "@/lib/ensure-schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    return Response.json({ tasks: rows });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const prompt = String(body?.prompt ?? "").trim();
    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await runAgent(prompt);

    const [task] = await db
      .insert(tasks)
      .values({
        title: result.title,
        prompt,
        category: result.category,
        status: "completed",
        summary: result.summary,
        updatedAt: new Date(),
      })
      .returning();

    if (result.steps.length) {
      await db.insert(steps).values(
        result.steps.map((s, i) => ({
          taskId: task.id,
          idx: i,
          title: s.title,
          detail: s.detail,
          status: "done",
        })),
      );
    }

    if (result.deliverables.length) {
      await db.insert(deliverables).values(
        result.deliverables.map((d) => ({
          taskId: task.id,
          type: d.type,
          title: d.title,
          content: d.content,
          meta: d.meta ?? {},
        })),
      );
    }

    const taskSteps = await db
      .select()
      .from(steps)
      .where(eq(steps.taskId, task.id))
      .orderBy(steps.idx);
    const taskDeliverables = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.taskId, task.id))
      .orderBy(deliverables.id);

    return Response.json({
      task,
      steps: taskSteps,
      deliverables: taskDeliverables,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Agent failed to run" }, { status: 500 });
  }
}
