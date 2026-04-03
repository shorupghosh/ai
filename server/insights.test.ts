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

describe("Weekly Insights Router", () => {
  it("should generate weekly insights with all metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result).toHaveProperty("weekStart");
    expect(result).toHaveProperty("weekEnd");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("insights");

    expect(typeof result.weekStart).toBe("string");
    expect(typeof result.weekEnd).toBe("string");
    expect(typeof result.insights).toBe("string");
  }, { timeout: 30000 });

  it("should calculate task completion metrics correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.metrics.taskCompletion).toHaveProperty("completed");
    expect(result.metrics.taskCompletion).toHaveProperty("total");
    expect(result.metrics.taskCompletion).toHaveProperty("percentage");

    expect(typeof result.metrics.taskCompletion.completed).toBe("number");
    expect(typeof result.metrics.taskCompletion.total).toBe("number");
    expect(typeof result.metrics.taskCompletion.percentage).toBe("number");

    expect(result.metrics.taskCompletion.percentage).toBeGreaterThanOrEqual(0);
    expect(result.metrics.taskCompletion.percentage).toBeLessThanOrEqual(100);
  }, { timeout: 30000 });

  it("should include sleep metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.metrics.sleep).toHaveProperty("avgHours");
    expect(result.metrics.sleep).toHaveProperty("avgQuality");

    expect(typeof result.metrics.sleep.avgHours).toBe("number");
    expect(typeof result.metrics.sleep.avgQuality).toBe("number");

    expect(result.metrics.sleep.avgHours).toBeGreaterThanOrEqual(0);
    expect(result.metrics.sleep.avgQuality).toBeGreaterThanOrEqual(0);
    expect(result.metrics.sleep.avgQuality).toBeLessThanOrEqual(10);
  }, { timeout: 30000 });

  it("should include mood and energy metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.metrics.mood).toHaveProperty("avg");
    expect(result.metrics.mood).toHaveProperty("energy");

    expect(typeof result.metrics.mood.avg).toBe("number");
    expect(typeof result.metrics.mood.energy).toBe("number");

    expect(result.metrics.mood.avg).toBeGreaterThanOrEqual(0);
    expect(result.metrics.mood.energy).toBeGreaterThanOrEqual(0);
  }, { timeout: 30000 });

  it("should track habit metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.metrics.habits).toHaveProperty("cigarettes");
    expect(result.metrics.habits).toHaveProperty("joints");
    expect(result.metrics.habits).toHaveProperty("stimulants");
    expect(result.metrics.habits).toHaveProperty("avgUrgeLevel");

    expect(typeof result.metrics.habits.cigarettes).toBe("number");
    expect(typeof result.metrics.habits.joints).toBe("number");
    expect(typeof result.metrics.habits.stimulants).toBe("number");
    expect(typeof result.metrics.habits.avgUrgeLevel).toBe("number");

    expect(result.metrics.habits.cigarettes).toBeGreaterThanOrEqual(0);
    expect(result.metrics.habits.joints).toBeGreaterThanOrEqual(0);
    expect(result.metrics.habits.stimulants).toBeGreaterThanOrEqual(0);
  }, { timeout: 30000 });

  it("should generate AI insights text", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.insights).toBeTruthy();
    expect(result.insights.length).toBeGreaterThan(0);
    expect(typeof result.insights).toBe("string");
  }, { timeout: 30000 });

  it("should include workout metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.weeklyInsights.generate({ weeksBack: 0 });

    expect(result.metrics).toHaveProperty("workouts");
    expect(typeof result.metrics.workouts).toBe("number");
    expect(result.metrics.workouts).toBeGreaterThanOrEqual(0);
  }, { timeout: 30000 });
});
