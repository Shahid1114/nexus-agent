import { db } from "@/db";
import { tasks, steps, deliverables } from "@/db/schema";
import { ensureSchema } from "@/lib/ensure-schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const taskSteps = await db
      .select()
      .from(steps)
      .where(eq(steps.taskId, taskId))
      .orderBy(steps.idx);
    const taskDeliverables = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.taskId, taskId))
      .orderBy(deliverables.id);

    return Response.json({
      task,
      steps: taskSteps,
      deliverables: taskDeliverables,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }
    await db.delete(tasks).where(eq(tasks.id, taskId));
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
