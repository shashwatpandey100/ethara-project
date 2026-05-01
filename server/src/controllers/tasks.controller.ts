// @ts-nocheck
import { Request, Response } from "express";
import { db } from "../db/index.js";
import { tasks, projects, projectMembers, taskComments, activityLog, user } from "../db/schema.js";
import { eq, and, desc, asc, sql, or, lt } from "drizzle-orm";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

async function checkProjectAccess(
  projectId: string,
  userId: string
): Promise<{ project: typeof projects.$inferSelect; role: string } | null> {
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project[0]) return null;

  if (project[0].createdBy === userId) {
    return { project: project[0], role: "admin" };
  }

  const membership = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (!membership[0]) return null;
  return { project: project[0], role: membership[0].role };
}

// GET /api/projects/:projectId/tasks
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;
    const assignee = req.query.assignee as string | undefined;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const conditions = [eq(tasks.projectId, projectId)];
    if (status) conditions.push(eq(tasks.status, status));
    if (assignee) conditions.push(eq(tasks.assigneeId, assignee));

    const data = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        createdBy: tasks.createdBy,
        dueDate: tasks.dueDate,
        order: tasks.order,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: user.name,
        assigneeImage: user.image,
      })
      .from(tasks)
      .leftJoin(user, eq(tasks.assigneeId, user.id))
      .where(and(...conditions))
      .orderBy(asc(tasks.order), desc(tasks.createdAt));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Failed to get tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

// GET /api/projects/:projectId/tasks/:taskId
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const task = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        createdBy: tasks.createdBy,
        dueDate: tasks.dueDate,
        order: tasks.order,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: user.name,
        assigneeImage: user.image,
      })
      .from(tasks)
      .leftJoin(user, eq(tasks.assigneeId, user.id))
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);

    if (!task[0]) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    // Get comments
    const comments = await db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        userId: taskComments.userId,
        createdAt: taskComments.createdAt,
        userName: user.name,
        userImage: user.image,
      })
      .from(taskComments)
      .leftJoin(user, eq(taskComments.userId, user.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));

    res.json({ success: true, data: { ...task[0], comments } });
  } catch (error) {
    console.error("Failed to get task:", error);
    res.status(500).json({ success: false, message: "Failed to fetch task" });
  }
};

// POST /api/projects/:projectId/tasks
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    if (access.role === "member") {
      res.status(403).json({ success: false, message: "Only admins can create tasks" });
      return;
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // Get max order
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`max(${tasks.order})` })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    const maxOrder = maxOrderResult[0]?.maxOrder ?? 0;

    const [task] = await db
      .insert(tasks)
      .values({
        projectId,
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        priority: parsed.data.priority,
        assigneeId: parsed.data.assigneeId,
        createdBy: userId,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        order: maxOrder + 1,
      })
      .returning();

    // Log activity
    await db.insert(activityLog).values({
      projectId,
      userId,
      action: "created",
      entityType: "task",
      entityId: task.id,
      meta: { title: task.title },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

// PATCH /api/projects/:projectId/tasks/:taskId
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);

    if (!task[0]) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    // Members can only update status of tasks assigned to them
    if (access.role === "member" && task[0].assigneeId !== userId) {
      res.status(403).json({ success: false, message: "You can only update tasks assigned to you" });
      return;
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const updateData: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
    if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId ?? undefined;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined;
    if (parsed.data.order !== undefined) updateData.order = parsed.data.order;

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .returning();

    // Log activity
    const action = parsed.data.status !== undefined ? "status_changed" : "updated";
    await db.insert(activityLog).values({
      projectId,
      userId,
      action,
      entityType: "task",
      entityId: taskId,
      meta: { title: task[0].title, newStatus: parsed.data.status },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access || access.role === "member") {
      res.status(403).json({ success: false, message: "Only admins can delete tasks" });
      return;
    }

    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);

    if (!task[0]) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Failed to delete task:", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

// POST /api/projects/:projectId/tasks/:taskId/comments
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user!.id;
    const { content } = req.body as { content: string };

    if (!content?.trim()) {
      res.status(400).json({ success: false, message: "Comment content is required" });
      return;
    }

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const [comment] = await db
      .insert(taskComments)
      .values({ taskId, userId, content: content.trim() })
      .returning();

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error("Failed to add comment:", error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// POST /api/projects/:projectId/tasks/bulk-delete
export const bulkDeleteTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const { taskIds } = req.body as { taskIds: string[] };

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      res.status(400).json({ success: false, message: "taskIds array is required" });
      return;
    }

    const access = await checkProjectAccess(projectId, userId);
    if (!access || access.role === "member") {
      res.status(403).json({ success: false, message: "Only admins can delete tasks" });
      return;
    }

    const results = await Promise.allSettled(
      taskIds.map((id) =>
        db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId)))
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    res.json({ success: true, data: { succeeded, failed } });
  } catch (error) {
    console.error("Failed to bulk delete tasks:", error);
    res.status(500).json({ success: false, message: "Failed to delete tasks" });
  }
};
