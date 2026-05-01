// @ts-nocheck
import { Request, Response } from "express";
import { db } from "../db/index.js";
import { projects, projectMembers, tasks, inviteLinks } from "../db/schema.js";
import { eq, and, desc, asc, ilike, sql, count, or, inArray } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

// GET /api/projects
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const search = ((req.query.search as string) || "").slice(0, 200);
    const sort = (req.query.sort as string) || "newest";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9));
    const offset = (page - 1) * limit;

    let orderBy;
    switch (sort) {
      case "oldest": orderBy = asc(projects.createdAt); break;
      case "name-asc": orderBy = asc(projects.name); break;
      case "name-desc": orderBy = desc(projects.name); break;
      case "newest": default: orderBy = desc(projects.createdAt); break;
    }

    // Projects where user is creator OR member
    const memberProjectIds = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const memberIds = memberProjectIds.map((r) => r.projectId);

    const ownerOrMember = memberIds.length > 0
      ? or(eq(projects.createdBy, userId), inArray(projects.id, memberIds))
      : eq(projects.createdBy, userId);

    const whereClause = and(
      ownerOrMember,
      search ? ilike(projects.name, `%${search}%`) : undefined
    );

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(projects)
      .where(whereClause);

    const data = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        createdBy: projects.createdBy,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        taskCount: sql<number>`cast(count(distinct ${tasks.id}) as integer)`,
        memberCount: sql<number>`cast(count(distinct ${projectMembers.userId}) as integer)`,
      })
      .from(projects)
      .leftJoin(tasks, eq(projects.id, tasks.projectId))
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(whereClause)
      .groupBy(
        projects.id, projects.name, projects.description,
        projects.status, projects.createdBy, projects.createdAt, projects.updatedAt
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    res.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to get projects:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

// GET /api/projects/:id
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    // Check if user has access (creator or member)
    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)))
      .limit(1);

    if (project[0].createdBy !== userId && !membership[0]) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    // Get member list with user info
    const members = await db
      .select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
      })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, id));

    const userRole =
      project[0].createdBy === userId
        ? "admin"
        : (membership[0]?.role ?? "member");

    res.json({
      success: true,
      data: { ...project[0], members, userRole },
    });
  } catch (error) {
    console.error("Failed to get project:", error);
    res.status(500).json({ success: false, message: "Failed to fetch project" });
  }
};

// POST /api/projects
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const [project] = await db
      .insert(projects)
      .values({ name: parsed.data.name, description: parsed.data.description, createdBy: userId })
      .returning();

    // Auto-add creator as admin member
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId,
      role: "admin",
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Failed to create project:", error);
    res.status(500).json({ success: false, message: "Failed to create project" });
  }
};

// PATCH /api/projects/:id
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Only admin can update
    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)))
      .limit(1);

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (project[0].createdBy !== userId && membership[0]?.role !== "admin") {
      res.status(403).json({ success: false, message: "Only admins can update projects" });
      return;
    }

    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const [updated] = await db
      .update(projects)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update project:", error);
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (project[0].createdBy !== userId) {
      res.status(403).json({ success: false, message: "Only the project creator can delete it" });
      return;
    }

    await db.delete(projects).where(eq(projects.id, id));

    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("Failed to delete project:", error);
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
};

// POST /api/projects/:id/invite
export const generateInviteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)))
      .limit(1);

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (project[0].createdBy !== userId && membership[0]?.role !== "admin") {
      res.status(403).json({ success: false, message: "Only admins can generate invite links" });
      return;
    }

    const code = crypto.randomBytes(8).toString("hex");

    const [link] = await db
      .insert(inviteLinks)
      .values({ projectId: id, code, createdBy: userId })
      .returning();

    res.json({ success: true, data: { code: link.code } });
  } catch (error) {
    console.error("Failed to generate invite link:", error);
    res.status(500).json({ success: false, message: "Failed to generate invite link" });
  }
};

// POST /api/projects/join/:code
export const joinViaInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const userId = req.user!.id;

    const link = await db
      .select()
      .from(inviteLinks)
      .where(eq(inviteLinks.code, code))
      .limit(1);

    if (!link[0]) {
      res.status(404).json({ success: false, message: "Invite link not found or expired" });
      return;
    }

    if (link[0].expiresAt && link[0].expiresAt < new Date()) {
      res.status(400).json({ success: false, message: "Invite link has expired" });
      return;
    }

    // Check if already a member
    const existing = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, link[0].projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    if (existing[0]) {
      res.json({ success: true, data: { projectId: link[0].projectId }, message: "Already a member" });
      return;
    }

    await db.insert(projectMembers).values({
      projectId: link[0].projectId,
      userId,
      role: "member",
    });

    res.json({ success: true, data: { projectId: link[0].projectId } });
  } catch (error) {
    console.error("Failed to join project:", error);
    res.status(500).json({ success: false, message: "Failed to join project" });
  }
};

// GET /api/projects/invite/:code
export const getInviteInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const link = await db
      .select({ projectId: inviteLinks.projectId })
      .from(inviteLinks)
      .where(eq(inviteLinks.code, code))
      .limit(1);

    if (!link[0]) {
      res.status(404).json({ success: false, message: "Invite link not found" });
      return;
    }

    const project = await db
      .select({ id: projects.id, name: projects.name, description: projects.description })
      .from(projects)
      .where(eq(projects.id, link[0].projectId))
      .limit(1);

    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const memberCount = await db
      .select({ count: count() })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, link[0].projectId));

    res.json({
      success: true,
      data: { ...project[0], memberCount: memberCount[0]?.count ?? 0 },
    });
  } catch (error) {
    console.error("Failed to get invite info:", error);
    res.status(500).json({ success: false, message: "Failed to get invite info" });
  }
};

// DELETE /api/projects/:id/members/:memberId
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)))
      .limit(1);

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project[0]) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (project[0].createdBy !== userId && membership[0]?.role !== "admin") {
      res.status(403).json({ success: false, message: "Only admins can remove members" });
      return;
    }

    // Can't remove the project creator
    if (memberId === project[0].createdBy) {
      res.status(400).json({ success: false, message: "Cannot remove the project creator" });
      return;
    }

    await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, memberId)));

    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    console.error("Failed to remove member:", error);
    res.status(500).json({ success: false, message: "Failed to remove member" });
  }
};

// PATCH /api/projects/:id/members/:memberId/role
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;
    const { role } = req.body as { role: "admin" | "member" };

    if (!["admin", "member"].includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
    }

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project[0] || project[0].createdBy !== userId) {
      res.status(403).json({ success: false, message: "Only the project creator can change roles" });
      return;
    }

    await db
      .update(projectMembers)
      .set({ role })
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, memberId)));

    res.json({ success: true, message: "Role updated" });
  } catch (error) {
    console.error("Failed to update member role:", error);
    res.status(500).json({ success: false, message: "Failed to update member role" });
  }
};
