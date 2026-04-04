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
  tasks: { id: "id", userId: "userId" },
  projects: { id: "id", userId: "userId", name: "name" },
  habits: { id: "id", userId: "userId" },
  sleep: { id: "id", userId: "userId" },
  gymDiet: { id: "id", userId: "userId" },
  dailyReviews: { id: "id", userId: "userId" },
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

describe("Daily Plan Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPlan = {
    tasks: [{ title: "Focus Work", startTime: "09:00", duration: 120, priority: "high" }],
    breaks: [{ time: "11:00", duration: 15 }],
    strategies: ["Use pomodoro"],
    summary: "Balanced day planned"
  };

  it("should generate daily plan with default energy level", async () => {
    const ctx = createAuthContext();
    
    // Mock DB calls
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // No existing tasks/reviews
    };
    (getDb as any).mockResolvedValue(mockDb);

    // Mock LLM
    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify(mockPlan)
        }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({});

    expect(result.success).toBe(true);
    expect(result.plan.summary).toBe("Balanced day planned");
    expect(result.energyLevel).toBeGreaterThanOrEqual(1);
  });

  it("should generate daily plan with custom energy level", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({ energyLevel: 8 });

    expect(result.energyLevel).toBe(8);
    expect(result.success).toBe(true);
  });

  it("should include tasks in the plan", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan.tasks).toHaveLength(1);
    expect(result.plan.tasks[0].title).toBe("Focus Work");
  });

  it("should include breaks in the plan", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan.breaks).toHaveLength(1);
    expect(result.plan.breaks[0].time).toBe("11:00");
  });

  it("should include strategies in the plan", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan.strategies).toContain("Use pomodoro");
  });

  it("should include summary in the plan", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan.summary).toBe("Balanced day planned");
  });

  it("should respect energy level input", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const lowEnergyPlan = await caller.ai.generateDailyPlan({ energyLevel: 3 });
    const highEnergyPlan = await caller.ai.generateDailyPlan({ energyLevel: 9 });

    expect(lowEnergyPlan.energyLevel).toBe(3);
    expect(highEnergyPlan.energyLevel).toBe(9);
  });

  it("should include task count in result", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockPlan) }
      }]
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateDailyPlan({});

    expect(typeof result.taskCount).toBe("number");
  });
});

