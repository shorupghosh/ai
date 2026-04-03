import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Telegram chat ID for bot integration */
  telegramChatId: varchar("telegramChatId", { length: 255 }),
  /** Google Calendar OAuth token for integration */
  googleCalendarToken: text("googleCalendarToken"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tasks table - stores user tasks with priority, due dates, and project association
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  projectId: int("projectId"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: date("dueDate"),
  scheduledTime: timestamp("scheduledTime"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  googleEventId: varchar("googleEventId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Projects table - stores user projects with stages and progress tracking
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  stage: mysqlEnum("stage", ["idea", "build", "test", "launch", "growth"]).default("idea").notNull(),
  progressPercent: decimal("progressPercent", { precision: 5, scale: 2 }).default("0.00").notNull(),
  nextAction: text("nextAction"),
  blocker: text("blocker"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Habits table - tracks habits like cigarettes, joints, stimulant use
 */
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  habitType: mysqlEnum("habitType", ["cigarettes", "joints", "stimulant_use"]).notNull(),
  count: int("count").default(0).notNull(),
  urgeLevel: int("urgeLevel"),
  triggerNotes: text("triggerNotes"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

/**
 * Sleep table - tracks sleep time, wake time, quality
 */
export const sleep = mysqlTable("sleep", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sleepTime: timestamp("sleepTime").notNull(),
  wakeTime: timestamp("wakeTime").notNull(),
  totalHours: decimal("totalHours", { precision: 4, scale: 2 }).notNull(),
  quality: int("quality"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sleep = typeof sleep.$inferSelect;
export type InsertSleep = typeof sleep.$inferInsert;

/**
 * GymDiet table - tracks workouts, weight, meals, protein, water intake
 */
export const gymDiet = mysqlTable("gymDiet", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workoutDone: boolean("workoutDone").default(false).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  meals: text("meals"),
  proteinIntake: int("proteinIntake"),
  waterIntake: int("waterIntake"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GymDiet = typeof gymDiet.$inferSelect;
export type InsertGymDiet = typeof gymDiet.$inferInsert;

/**
 * DailyReview table - stores daily reflections and mood/energy tracking
 */
export const dailyReviews = mysqlTable("dailyReviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  wins: text("wins"),
  misses: text("misses"),
  mood: int("mood"),
  energy: int("energy"),
  tomorrowFocus: text("tomorrowFocus"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReview = typeof dailyReviews.$inferSelect;
export type InsertDailyReview = typeof dailyReviews.$inferInsert;

/**
 * Relations for all tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
  habits: many(habits),
  sleep: many(sleep),
  gymDiet: many(gymDiet),
  dailyReviews: many(dailyReviews),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, { fields: [habits.userId], references: [users.id] }),
}));

export const sleepRelations = relations(sleep, ({ one }) => ({
  user: one(users, { fields: [sleep.userId], references: [users.id] }),
}));

export const gymDietRelations = relations(gymDiet, ({ one }) => ({
  user: one(users, { fields: [gymDiet.userId], references: [users.id] }),
}));

export const dailyReviewsRelations = relations(dailyReviews, ({ one }) => ({
  user: one(users, { fields: [dailyReviews.userId], references: [users.id] }),
}));


/**
 * Notifications table - stores habit trigger alerts and system notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["habit_trigger", "task_reminder", "daily_plan", "achievement"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  habitType: varchar("habitType", { length: 50 }),
  triggerLevel: int("triggerLevel"),
  copingStrategy: text("copingStrategy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

/**
 * Goals table - SMART goals with milestones and progress tracking
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["health", "career", "personal", "financial", "learning", "fitness"]).default("personal").notNull(),
  targetDate: date("targetDate"),
  status: mysqlEnum("status", ["active", "completed", "paused", "abandoned"]).default("active").notNull(),
  progressPercent: decimal("progressPercent", { precision: 5, scale: 2 }).default("0.00").notNull(),
  milestones: text("milestones"), // JSON string of milestone objects
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Journal table - freeform AI-powered journaling
 */
export const journal = mysqlTable("journal", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  mood: int("mood"), // 1-10
  tags: text("tags"), // JSON array of tags
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  aiSummary: text("aiSummary"),
  isGratitude: boolean("isGratitude").default(false).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Journal = typeof journal.$inferSelect;
export type InsertJournal = typeof journal.$inferInsert;

/**
 * Focus Sessions table - Pomodoro and deep work tracking
 */
export const focusSessions = mysqlTable("focusSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId"),
  duration: int("duration").notNull(), // in minutes
  type: mysqlEnum("type", ["pomodoro", "deep_work", "custom"]).default("pomodoro").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  distractionCount: int("distractionCount").default(0),
});

export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = typeof focusSessions.$inferInsert;

/**
 * Achievements table - Gamification with XP, badges, streaks
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // e.g. "task_streak_7", "focus_100_min"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // emoji or icon name
  xpAwarded: int("xpAwarded").default(0).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// Extended relations
export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));

export const journalRelations = relations(journal, ({ one }) => ({
  user: one(users, { fields: [journal.userId], references: [users.id] }),
}));

export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  user: one(users, { fields: [focusSessions.userId], references: [users.id] }),
  task: one(tasks, { fields: [focusSessions.taskId], references: [tasks.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));
