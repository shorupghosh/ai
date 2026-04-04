import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock schema imports Since they are used in routers.ts
vi.mock("../drizzle/schema", () => ({
  users: { id: "id" },
  tasks: { id: "id", userId: "userId" },
  projects: { id: "id", userId: "userId" },
  habits: { id: "id", userId: "userId" },
  sleep: { id: "id", userId: "userId" },
  gymDiet: { id: "id", userId: "userId" },
  dailyReviews: { id: "id", userId: "userId" },
  notifications: { id: "id", userId: "userId" },
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    telegramChatId: null,
    googleCalendarToken: null,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a task", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ id: 1 }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.create({
      title: "Test Task",
      priority: "high",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list tasks for user", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1, title: "Listed Task" }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Listed Task");
  });
});

describe("Projects API", () => {
  it("should create a project", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ id: 1 }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.create({
      name: "Test Project",
      stage: "build",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list projects for user", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1, name: "Test Project" }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.list();
    expect(result).toHaveLength(1);
  });
});

describe("Habits API", () => {
  it("should log a habit", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ id: 1 }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.habits.log({
      habitType: "cigarettes",
      count: 2,
      urgeLevel: 7,
      date: new Date(),
    });

    expect(result).toEqual({ success: true });
  });
});

describe("Daily Review API", () => {
  it("should create a daily review", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ id: 1 }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.dailyReview.create({
      mood: 8,
      energy: 7,
      date: new Date(),
    });

    expect(result).toEqual({ success: true });
  });
});

