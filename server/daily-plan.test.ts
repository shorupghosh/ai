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

describe("Daily Plan Generation", () => {
  it("should generate daily plan with default energy level", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("energyLevel");
    expect(result).toHaveProperty("taskCount");
    expect(result).toHaveProperty("plan");

    expect(typeof result.energyLevel).toBe("number");
    expect(result.energyLevel).toBeGreaterThanOrEqual(1);
    expect(result.energyLevel).toBeLessThanOrEqual(10);
  }, { timeout: 30000 });

  it("should generate daily plan with custom energy level", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({ energyLevel: 8 });

    expect(result.energyLevel).toBe(8);
    expect(result.success).toBe(true);
  }, { timeout: 30000 });

  it("should include tasks in the plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan).toHaveProperty("tasks");
    expect(Array.isArray(result.plan.tasks)).toBe(true);
  }, { timeout: 30000 });

  it("should include breaks in the plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan).toHaveProperty("breaks");
    expect(Array.isArray(result.plan.breaks)).toBe(true);
  }, { timeout: 30000 });

  it("should include strategies in the plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan).toHaveProperty("strategies");
    expect(Array.isArray(result.plan.strategies)).toBe(true);
  }, { timeout: 30000 });

  it("should include summary in the plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    expect(result.plan).toHaveProperty("summary");
    expect(typeof result.plan.summary).toBe("string");
    expect(result.plan.summary.length).toBeGreaterThan(0);
  }, { timeout: 30000 });

  it("should have valid task structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    if (result.plan.tasks && result.plan.tasks.length > 0) {
      const task = result.plan.tasks[0];
      expect(task).toHaveProperty("title");
      expect(task).toHaveProperty("startTime");
      expect(task).toHaveProperty("duration");
      expect(task).toHaveProperty("priority");

      expect(typeof task.title).toBe("string");
      expect(typeof task.startTime).toBe("string");
      expect(typeof task.duration).toBe("number");
      expect(typeof task.priority).toBe("string");
    }
  }, { timeout: 30000 });

  it("should have valid break structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    if (result.plan.breaks && result.plan.breaks.length > 0) {
      const breakItem = result.plan.breaks[0];
      expect(breakItem).toHaveProperty("time");
      expect(breakItem).toHaveProperty("duration");

      expect(typeof breakItem.time).toBe("string");
      expect(typeof breakItem.duration).toBe("number");
    }
  }, { timeout: 30000 });

  it("should respect energy level input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lowEnergyPlan = await caller.ai.generateDailyPlan({ energyLevel: 3 });
    const highEnergyPlan = await caller.ai.generateDailyPlan({ energyLevel: 9 });

    expect(lowEnergyPlan.energyLevel).toBe(3);
    expect(highEnergyPlan.energyLevel).toBe(9);

    // Both should have valid plans
    expect(lowEnergyPlan.plan).toBeTruthy();
    expect(highEnergyPlan.plan).toBeTruthy();
  }, { timeout: 60000 });

  it("should include task count in result", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateDailyPlan({});

    expect(typeof result.taskCount).toBe("number");
    expect(result.taskCount).toBeGreaterThanOrEqual(0);
  }, { timeout: 30000 });
});
