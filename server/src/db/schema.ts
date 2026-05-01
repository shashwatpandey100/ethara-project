import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  index,
  jsonb,
  unique,
  integer,
} from "drizzle-orm/pg-core";

// ── Better Auth tables ──────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  displayUsername: text("display_username").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// ── Projects ────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // active | archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Team Members ─────────────────────────────────────────────────────────────

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // admin | member
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    unqUserProject: unique().on(t.projectId, t.userId),
    projectIdx: index("pm_project_idx").on(t.projectId),
    userIdx: index("pm_user_idx").on(t.userId),
  })
);

export const inviteLinks = pgTable("invite_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Tasks ────────────────────────────────────────────────────────────────────

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("todo"), // todo | in_progress | in_review | done
    priority: text("priority").notNull().default("medium"), // low | medium | high | urgent
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dueDate: timestamp("due_date"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    projectIdx: index("task_project_idx").on(t.projectId),
    assigneeIdx: index("task_assignee_idx").on(t.assigneeId),
  })
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    taskIdx: index("comment_task_idx").on(t.taskId),
  })
);

// ── AI Standups ───────────────────────────────────────────────────────────────

export const standups = pgTable(
  "standups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Voice Standup"),
    audioUrl: text("audio_url").notNull(),
    status: text("status").notNull().default("processing"), // processing | completed | failed
    transcript: text("transcript"),
    summary: text("summary"), // AI generated summary HTML
    extractedTasks: jsonb("extracted_tasks"), // AI extracted task suggestions
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    projectIdx: index("standup_project_idx").on(t.projectId),
  })
);

// ── Activity Log ─────────────────────────────────────────────────────────────

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // created | updated | deleted | status_changed | assigned
    entityType: text("entity_type").notNull(), // task | standup | member | project
    entityId: text("entity_id").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    projectIdx: index("activity_project_idx").on(t.projectId),
    userIdx: index("activity_user_idx").on(t.userId),
  })
);

// ── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  projectsCreated: many(projects),
  memberships: many(projectMembers),
  tasks: many(tasks),
  comments: many(taskComments),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(user, { fields: [projects.createdBy], references: [user.id] }),
  members: many(projectMembers),
  tasks: many(tasks),
  inviteLinks: many(inviteLinks),
  standups: many(standups),
  activityLog: many(activityLog),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(user, { fields: [projectMembers.userId], references: [user.id] }),
}));

export const inviteLinksRelations = relations(inviteLinks, ({ one }) => ({
  project: one(projects, { fields: [inviteLinks.projectId], references: [projects.id] }),
  creator: one(user, { fields: [inviteLinks.createdBy], references: [user.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(user, { fields: [tasks.assigneeId], references: [user.id] }),
  creator: one(user, { fields: [tasks.createdBy], references: [user.id] }),
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, { fields: [taskComments.taskId], references: [tasks.id] }),
  user: one(user, { fields: [taskComments.userId], references: [user.id] }),
}));

export const standupsRelations = relations(standups, ({ one }) => ({
  project: one(projects, { fields: [standups.projectId], references: [projects.id] }),
  creator: one(user, { fields: [standups.createdBy], references: [user.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  project: one(projects, { fields: [activityLog.projectId], references: [projects.id] }),
  user: one(user, { fields: [activityLog.userId], references: [user.id] }),
}));
