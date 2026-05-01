import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  generateInviteLink,
  joinViaInvite,
  getInviteInfo,
  removeMember,
  updateMemberRole,
} from "../controllers/projects.controller.js";
import { getTasks, createTask, updateTask, deleteTask, getTaskById, addComment, bulkDeleteTasks } from "../controllers/tasks.controller.js";
import { getStandups, getStandupById, createStandup, confirmStandupTasks, deleteStandup } from "../controllers/standups.controller.js";

const router = Router();

router.use(requireAuth);

// Projects CRUD
router.get("/", getProjects);
router.post("/", createProject);
router.get("/invite/:code", getInviteInfo);
router.post("/join/:code", joinViaInvite);
router.get("/:id", getProjectById);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

// Invite links
router.post("/:id/invite", generateInviteLink);

// Members
router.delete("/:id/members/:memberId", removeMember);
router.patch("/:id/members/:memberId/role", updateMemberRole);

// Tasks (nested under project)
router.get("/:projectId/tasks", getTasks);
router.post("/:projectId/tasks", createTask);
router.post("/:projectId/tasks/bulk-delete", bulkDeleteTasks);
router.get("/:projectId/tasks/:taskId", getTaskById);
router.patch("/:projectId/tasks/:taskId", updateTask);
router.delete("/:projectId/tasks/:taskId", deleteTask);
router.post("/:projectId/tasks/:taskId/comments", addComment);

// Standups
router.get("/:projectId/standups", getStandups);
router.post("/:projectId/standups", createStandup);
router.get("/:projectId/standups/:standupId", getStandupById);
router.post("/:projectId/standups/:standupId/confirm-tasks", confirmStandupTasks);
router.delete("/:projectId/standups/:standupId", deleteStandup);

export default router;
