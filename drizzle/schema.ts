import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  telegramChatId: text("telegramChatId"),
  googleCalendarToken: text("googleCalendarToken"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(), // SQLite doesn't natively support onUpdateNow in schema builder for integer timestamp nicely, but we can do it in app layer or just leave as is. Drizzle handles some of it.
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("projectId"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  scheduledTime: integer("scheduledTime", { mode: "timestamp" }),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  isCompleted: integer("isCompleted", { mode: "boolean" }).default(false).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  googleEventId: text("googleEventId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  stage: text("stage", { enum: ["idea", "build", "test", "launch", "growth"] }).default("idea").notNull(),
  progressPercent: real("progressPercent").default(0.00).notNull(),
  nextAction: text("nextAction"),
  blocker: text("blocker"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  habitType: text("habitType", { enum: ["cigarettes", "joints", "alcohol", "stimulants", "porn"] }).notNull(),
  count: integer("count").default(0).notNull(),
  urgeLevel: integer("urgeLevel"),
  triggerNotes: text("triggerNotes"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

export const sleep = sqliteTable("sleep", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  sleepTime: integer("sleepTime", { mode: "timestamp" }).notNull(),
  wakeTime: integer("wakeTime", { mode: "timestamp" }).notNull(),
  totalHours: real("totalHours").notNull(),
  quality: integer("quality"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Sleep = typeof sleep.$inferSelect;
export type InsertSleep = typeof sleep.$inferInsert;

export const gymDiet = sqliteTable("gymDiet", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  workoutDone: integer("workoutDone", { mode: "boolean" }).default(false).notNull(),
  weight: real("weight"),
  meals: text("meals"),
  proteinIntake: integer("proteinIntake"),
  waterIntake: integer("waterIntake"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type GymDiet = typeof gymDiet.$inferSelect;
export type InsertGymDiet = typeof gymDiet.$inferInsert;

export const dailyReviews = sqliteTable("dailyReviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  wins: text("wins"),
  misses: text("misses"),
  mood: integer("mood"),
  energy: integer("energy"),
  tomorrowFocus: text("tomorrowFocus"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type DailyReview = typeof dailyReviews.$inferSelect;
export type InsertDailyReview = typeof dailyReviews.$inferInsert;

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  type: text("type", { enum: ["habit_trigger", "system_alert", "reminder"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
  habitType: text("habitType"),
  triggerLevel: integer("triggerLevel"),
  copingStrategy: text("copingStrategy"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["personal", "professional", "health", "finance"] }).default("personal").notNull(),
  targetDate: integer("targetDate", { mode: "timestamp" }),
  status: text("status", { enum: ["active", "paused", "completed", "archived"] }).default("active").notNull(),
  progressPercent: real("progressPercent").default(0.00).notNull(),
  milestones: text("milestones"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

export const journal = sqliteTable("journal", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  mood: integer("mood"),
  tags: text("tags"),
  sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
  aiSummary: text("aiSummary"),
  isGratitude: integer("isGratitude", { mode: "boolean" }).default(false).notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Journal = typeof journal.$inferSelect;
export type InsertJournal = typeof journal.$inferInsert;

export const focusSessions = sqliteTable("focusSessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  taskId: integer("taskId"),
  duration: integer("duration").notNull(),
  type: text("type", { enum: ["pomodoro", "deep_work", "shallow_work"] }).default("pomodoro").notNull(),
  status: text("status", { enum: ["active", "completed", "interrupted"] }).default("active").notNull(),
  startedAt: integer("startedAt", { mode: "timestamp" }).defaultNow().notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  notes: text("notes"),
  distractionCount: integer("distractionCount").default(0),
});

export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = typeof focusSessions.$inferInsert;

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  xpAwarded: integer("xpAwarded").default(0).notNull(),
  unlockedAt: integer("unlockedAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
  habits: many(habits),
  sleep: many(sleep),
  gymDiet: many(gymDiet),
  dailyReviews: many(dailyReviews),
  notifications: many(notifications),
  goals: many(goals),
  journal: many(journal),
  focusSessions: many(focusSessions),
  achievements: many(achievements),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

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
