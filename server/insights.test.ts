import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock schema imports Since they are used in routers.ts
vi.mock("../drizzle/schema", () => ({
  users: { id: "id" },
  tasks: { id: "id", userId: "userId", createdAt: "createdAt" },
  projects: { id: "id", userId: "userId", name: "name" },
  habits: { id: "id", userId: "userId", type: "type", date: "date", urgeLevel: "urgeLevel" },
  sleep: { id: "id", userId: "userId", date: "date", hours: "hours", quality: "quality" },
  gymDiet: { id: "id", userId: "userId", date: "date" },
  dailyReviews: { id: "id", userId: "userId", date: "date", mood: "mood", energy: "energy" },
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

describe("Weekly Insights Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInsights = "Great progress this week! Keep it up.";

  it("should generate weekly insights with all metrics", async () => {
    const ctx = createAuthContext();
    
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: mockInsights }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result).toHaveProperty("weekStart");
    expect(result).toHaveProperty("weekEnd");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("insights");
  });

  it("should calculate task completion metrics correctly", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: mockInsights } }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.metrics.taskCompletion).toHaveProperty("percentage");
    expect(typeof result.metrics.taskCompletion.percentage).toBe("number");
  });

  it("should include sleep metrics", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: mockInsights } }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(typeof result.metrics.sleep.avgHours).toBe("number");
  });

  it("should include mood and energy metrics", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: mockInsights } }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(typeof result.metrics.mood.avg).toBe("number");
  });

  it("should track habit metrics", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: mockInsights } }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(typeof result.metrics.habits.avgUrgeLevel).toBe("number");
  });

  it("should generate AI insights text", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: mockInsights } }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.insights).toBe(mockInsights);
  });

  it("should include workout metrics", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: mockInsights } }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(typeof result.metrics.workouts).toBe("number");
  });
});

