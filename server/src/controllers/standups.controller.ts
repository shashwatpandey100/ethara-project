// @ts-nocheck
import { Request, Response } from "express";
import { db } from "../db/index.js";
import { standups, projects, projectMembers, tasks, activityLog } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { transcribeAudio } from "../lib/deepgram.js";
import { generateStandupSummary, extractTasksFromTranscript } from "../lib/gemini.js";
import { z } from "zod";

async function checkProjectAccess(
  projectId: string,
  userId: string
): Promise<{ project: typeof projects.$inferSelect; role: string } | null> {
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project[0]) return null;

  if (project[0].createdBy === userId) return { project: project[0], role: "admin" };

  const membership = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (!membership[0]) return null;
  return { project: project[0], role: membership[0].role };
}

const createStandupSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  audioUrl: z.string().url("Audio URL must be a valid URL"),
});

// GET /api/projects/:projectId/standups
export const getStandups = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const data = await db
      .select()
      .from(standups)
      .where(eq(standups.projectId, projectId))
      .orderBy(desc(standups.createdAt));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Failed to get standups:", error);
    res.status(500).json({ success: false, message: "Failed to fetch standups" });
  }
};

// GET /api/projects/:projectId/standups/:standupId
export const getStandupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, standupId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const standup = await db
      .select()
      .from(standups)
      .where(and(eq(standups.id, standupId), eq(standups.projectId, projectId)))
      .limit(1);

    if (!standup[0]) {
      res.status(404).json({ success: false, message: "Standup not found" });
      return;
    }

    res.json({ success: true, data: standup[0] });
  } catch (error) {
    console.error("Failed to get standup:", error);
    res.status(500).json({ success: false, message: "Failed to fetch standup" });
  }
};

// POST /api/projects/:projectId/standups
export const createStandup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const parsed = createStandupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const [standup] = await db
      .insert(standups)
      .values({
        projectId,
        createdBy: userId,
        title: parsed.data.title ?? "Voice Standup",
        audioUrl: parsed.data.audioUrl,
        status: "processing",
      })
      .returning();

    // Fire-and-forget AI pipeline
    runStandupPipeline(standup.id, parsed.data.audioUrl).catch((err) => {
      console.error(`Standup pipeline failed for ${standup.id}:`, err);
    });

    res.status(201).json({ success: true, data: standup });
  } catch (error) {
    console.error("Failed to create standup:", error);
    res.status(500).json({ success: false, message: "Failed to create standup" });
  }
};

async function runStandupPipeline(standupId: string, audioUrl: string): Promise<void> {
  try {
    // Step 1: Transcribe audio
    console.log(`[Standup ${standupId}] Transcribing audio...`);
    const { text: transcript } = await transcribeAudio(audioUrl);

    // Step 2: Generate summary and extract tasks in parallel
    console.log(`[Standup ${standupId}] Generating summary and extracting tasks...`);
    const [summary, extracted] = await Promise.all([
      generateStandupSummary(transcript),
      extractTasksFromTranscript(transcript),
    ]);

    // Step 3: Update standup record
    await db
      .update(standups)
      .set({
        status: "completed",
        transcript,
        summary,
        extractedTasks: extracted,
      })
      .where(eq(standups.id, standupId));

    console.log(`[Standup ${standupId}] Pipeline completed. Extracted ${extracted.tasks.length} tasks.`);
  } catch (error) {
    console.error(`[Standup ${standupId}] Pipeline failed:`, error);
    await db.update(standups).set({ status: "failed" }).where(eq(standups.id, standupId));
  }
}

// POST /api/projects/:projectId/standups/:standupId/confirm-tasks
export const confirmStandupTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, standupId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access || access.role === "member") {
      res.status(403).json({ success: false, message: "Only admins can confirm standup tasks" });
      return;
    }

    const standup = await db
      .select()
      .from(standups)
      .where(and(eq(standups.id, standupId), eq(standups.projectId, projectId)))
      .limit(1);

    if (!standup[0] || standup[0].status !== "completed") {
      res.status(400).json({ success: false, message: "Standup not ready or not found" });
      return;
    }

    const { selectedTasks } = req.body as {
      selectedTasks: Array<{
        title: string;
        description: string;
        priority: "low" | "medium" | "high" | "urgent";
      }>;
    };

    if (!Array.isArray(selectedTasks) || selectedTasks.length === 0) {
      res.status(400).json({ success: false, message: "No tasks selected" });
      return;
    }

    // Get current max order
    const existing = await db
      .select({ order: tasks.order })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.order))
      .limit(1);

    let orderBase = existing[0]?.order ?? 0;

    const created = await db
      .insert(tasks)
      .values(
        selectedTasks.map((t, i) => ({
          projectId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: "todo" as const,
          createdBy: userId,
          order: orderBase + i + 1,
        }))
      )
      .returning();

    // Log activity
    await db.insert(activityLog).values({
      projectId,
      userId,
      action: "created",
      entityType: "standup",
      entityId: standupId,
      meta: { tasksCreated: created.length },
    });

    res.json({ success: true, data: { created } });
  } catch (error) {
    console.error("Failed to confirm standup tasks:", error);
    res.status(500).json({ success: false, message: "Failed to confirm tasks" });
  }
};

// DELETE /api/projects/:projectId/standups/:standupId
export const deleteStandup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, standupId } = req.params;
    const userId = req.user!.id;

    const access = await checkProjectAccess(projectId, userId);
    if (!access || access.role === "member") {
      res.status(403).json({ success: false, message: "Only admins can delete standups" });
      return;
    }

    await db
      .delete(standups)
      .where(and(eq(standups.id, standupId), eq(standups.projectId, projectId)));

    res.json({ success: true, message: "Standup deleted" });
  } catch (error) {
    console.error("Failed to delete standup:", error);
    res.status(500).json({ success: false, message: "Failed to delete standup" });
  }
};
