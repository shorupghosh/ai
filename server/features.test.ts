import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Tasks API", () => {
  it("should create a task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Test Task",
      description: "A test task",
      priority: "high",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list tasks for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should complete a task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a task first
    await caller.tasks.create({ title: "Task to Complete" });

    // List to get the ID
    const tasks = await caller.tasks.list();
    if (tasks.length > 0) {
      const result = await caller.tasks.complete({ id: tasks[0].id });
      expect(result).toEqual({ success: true });
    }
  });

  it("should delete a task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a task first
    await caller.tasks.create({ title: "Task to Delete" });

    // List to get the ID
    const tasks = await caller.tasks.list();
    if (tasks.length > 0) {
      const result = await caller.tasks.delete({ id: tasks[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("Projects API", () => {
  it("should create a project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Test Project",
      stage: "build",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list projects for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should update a project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    await caller.projects.create({ name: "Project to Update" });

    // List to get the ID
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const result = await caller.projects.update({
        id: projects[0].id,
        progressPercent: "50.00",
        nextAction: "Complete phase 1",
      });
      expect(result).toEqual({ success: true });
    }
  });

  it("should delete a project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    await caller.projects.create({ name: "Project to Delete" });

    // List to get the ID
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const result = await caller.projects.delete({ id: projects[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("Habits API", () => {
  it("should log a habit", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.habits.log({
      habitType: "cigarettes",
      count: 2,
      urgeLevel: 7,
      triggerNotes: "Stress",
      date: new Date(),
    });

    expect(result).toEqual({ success: true });
  });

  it("should list habits for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.habits.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should delete a habit entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Log a habit first
    await caller.habits.log({
      habitType: "joints",
      count: 1,
      date: new Date(),
    });

    // List to get the ID
    const habits = await caller.habits.list();
    if (habits.length > 0) {
      const result = await caller.habits.delete({ id: habits[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("Sleep API", () => {
  it("should log sleep", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const sleepTime = new Date();
    sleepTime.setHours(23, 0, 0);
    const wakeTime = new Date();
    wakeTime.setHours(7, 0, 0);
    wakeTime.setDate(wakeTime.getDate() + 1);

    const result = await caller.sleep.log({
      sleepTime,
      wakeTime,
      quality: 8,
      date: new Date(),
    });

    expect(result).toEqual({ success: true });
  });

  it("should list sleep entries for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sleep.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should delete a sleep entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Log sleep first
    const sleepTime = new Date();
    sleepTime.setHours(23, 0, 0);
    const wakeTime = new Date();
    wakeTime.setHours(7, 0, 0);
    wakeTime.setDate(wakeTime.getDate() + 1);

    await caller.sleep.log({
      sleepTime,
      wakeTime,
      date: new Date(),
    });

    // List to get the ID
    const sleepEntries = await caller.sleep.list();
    if (sleepEntries.length > 0) {
      const result = await caller.sleep.delete({ id: sleepEntries[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("Gym/Diet API", () => {
  it("should log gym/diet entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gymDiet.log({
      workoutDone: true,
      weight: "75.5",
      proteinIntake: 150,
      waterIntake: 2000,
      meals: "Breakfast, Lunch, Dinner",
      date: new Date(),
    });

    expect(result).toEqual({ success: true });
  });

  it("should list gym/diet entries for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gymDiet.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should delete a gym/diet entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Log entry first
    await caller.gymDiet.log({
      workoutDone: false,
      date: new Date(),
    });

    // List to get the ID
    const entries = await caller.gymDiet.list();
    if (entries.length > 0) {
      const result = await caller.gymDiet.delete({ id: entries[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("Daily Review API", () => {
  it("should create a daily review", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyReview.create({
      wins: "Completed 3 tasks",
      misses: "Didn't exercise",
      mood: 8,
      energy: 7,
      tomorrowFocus: "Focus on health",
      date: new Date(),
    });

    expect(result).toEqual({ success: true });
  });

  it("should list daily reviews for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dailyReview.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should delete a daily review", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a review first
    await caller.dailyReview.create({
      mood: 7,
      energy: 6,
      date: new Date(),
    });

    // List to get the ID
    const reviews = await caller.dailyReview.list();
    if (reviews.length > 0) {
      const result = await caller.dailyReview.delete({ id: reviews[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});
