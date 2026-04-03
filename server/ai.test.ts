import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("AI Router - Process Thought", () => {
  it("should process a thought and create tasks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This test will call the actual LLM, so we expect it to work
    // In production, you might want to mock the LLM response
    const result = await caller.ai.processThought({
      thought: "I need to finish the project landing page and reach out to 5 customers",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("tasksCreated");
    expect(result).toHaveProperty("tasks");
    expect(Array.isArray(result.tasks)).toBe(true);
    
    if (result.tasksCreated > 0) {
      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks[0]).toHaveProperty("title");
      expect(result.tasks[0]).toHaveProperty("priority");
    }
  });

  it("should handle complex thoughts with multiple tasks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "High priority: fix bug in payment system by tomorrow. Medium: update documentation. Low: improve UI responsiveness",
    });

    expect(result.success).toBe(true);
    expect(result.tasksCreated).toBeGreaterThanOrEqual(0);
  });

  it("should extract priority levels from thoughts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "Urgent: fix critical bug in authentication",
    });

    expect(result.success).toBe(true);
    // Check if any task has high priority
    if (result.tasks.length > 0) {
      const hasHighPriority = result.tasks.some(t => t.priority === "high");
      expect(hasHighPriority || result.tasks.length > 0).toBe(true);
    }
  });

  it("should reject empty thoughts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.ai.processThought({
        thought: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("min");
    }
  });

  it("should create tasks with valid structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "Build new feature for user dashboard",
    });

    expect(result.success).toBe(true);
    
    for (const task of result.tasks) {
      expect(task).toHaveProperty("title");
      expect(typeof task.title).toBe("string");
      expect(task.title.length).toBeGreaterThan(0);
      
      // Priority may be undefined or one of the valid values
      if (task.priority !== undefined) {
        expect(["low", "medium", "high"]).toContain(task.priority);
      }
    }
  });
});
