// @ts-nocheck
import { Request, Response } from "express";
import { db } from "../db/index.js";
import { projects, projectMembers, tasks, activityLog, user } from "../db/schema.js";
import { eq, and, sql, count, desc, lt, inArray } from "drizzle-orm";
import { generateProjectDigest } from "../lib/gemini.js";

// GET /api/dashboard
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // All projects accessible to user
    const memberProjectIds = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const accessibleIds = memberProjectIds.map((r) => r.projectId);

    // My tasks (assigned to me across all projects)
    const myTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        projectId: tasks.projectId,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.assigneeId, userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(20);

    const myTaskStats = {
      total: myTasks.length,
      todo: myTasks.filter((t) => t.status === "todo").length,
      inProgress: myTasks.filter((t) => t.status === "in_progress").length,
      inReview: myTasks.filter((t) => t.status === "in_review").length,
      done: myTasks.filter((t) => t.status === "done").length,
      overdue: myTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
      ).length,
    };

    // Projects summary
    const projectCount = accessibleIds.length;

    // Recent activity
    const recentActivity =
      accessibleIds.length > 0
        ? await db
            .select({
              id: activityLog.id,
              action: activityLog.action,
              entityType: activityLog.entityType,
              meta: activityLog.meta,
              createdAt: activityLog.createdAt,
              projectId: activityLog.projectId,
              userName: user.name,
            })
            .from(activityLog)
            .leftJoin(user, eq(activityLog.userId, user.id))
            .where(inArray(activityLog.projectId, accessibleIds))
            .orderBy(desc(activityLog.createdAt))
            .limit(10)
        : [];

    // Overdue tasks (all accessible projects)
    const overdueTasks =
      accessibleIds.length > 0
        ? await db
            .select({
              id: tasks.id,
              title: tasks.title,
              priority: tasks.priority,
              dueDate: tasks.dueDate,
              projectId: tasks.projectId,
              assigneeId: tasks.assigneeId,
            })
            .from(tasks)
            .where(
              and(
                inArray(tasks.projectId, accessibleIds),
                lt(tasks.dueDate, new Date()),
                sql`${tasks.status} != 'done'`
              )
            )
            .orderBy(tasks.dueDate)
            .limit(10)
        : [];

    res.json({
      success: true,
      data: {
        myTaskStats,
        projectCount,
        recentActivity,
        overdueTasks,
        recentTasks: myTasks.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

// GET /api/dashboard/projects/:projectId/digest
export const getProjectDigest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    if (project[0].createdBy !== userId && !membership[0]) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assigneeName: user.name,
      })
      .from(tasks)
      .leftJoin(user, eq(tasks.assigneeId, user.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.updatedAt));

    const overdue = projectTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length;

    const digest = await generateProjectDigest({
      projectName: project[0].name,
      totalTasks: projectTasks.length,
      todoCount: projectTasks.filter((t) => t.status === "todo").length,
      inProgressCount: projectTasks.filter((t) => t.status === "in_progress").length,
      inReviewCount: projectTasks.filter((t) => t.status === "in_review").length,
      doneCount: projectTasks.filter((t) => t.status === "done").length,
      overdueCount: overdue,
      recentTasks: projectTasks.slice(0, 15).map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assigneeName ?? undefined,
      })),
    });

    res.json({ success: true, data: { digest } });
  } catch (error) {
    console.error("Failed to generate project digest:", error);
    res.status(500).json({ success: false, message: "Failed to generate digest" });
  }
};
