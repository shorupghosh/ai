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

// Mock schema imports since they are used in routers.ts
vi.mock("../drizzle/schema", () => ({
  users: { id: "id" },
  tasks: { id: "id", userId: "userId" },
  projects: { id: "id", userId: "userId", name: "name" },
  habits: { id: "id" },
  sleep: { id: "id" },
  gymDiet: { id: "id" },
  dailyReviews: { id: "id" },
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

describe("AI Router - Process Thought", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process a thought and create tasks", async () => {
    const ctx = createAuthContext();
    
    // Mock DB select and insert
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1, name: "Project 1" }]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ id: 101, title: "Finish Landing Page" }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    // Mock LLM response
    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            tasks: [
              { title: "Finish Landing Page", priority: "high" },
              { title: "Reach out to 5 customers", priority: "medium" }
            ]
          })
        }
      }]
    });

    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "I need to finish the project landing page and reach out to 5 customers",
    });

    expect(result.success).toBe(true);
    expect(result.tasksCreated).toBe(2);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe("Finish Landing Page");
    expect(invokeLLM).toHaveBeenCalled();
  });

  it("should handle complex thoughts with multiple tasks", async () => {
    const ctx = createAuthContext();
    
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            tasks: [
              { title: "Fix bug", priority: "high" },
              { title: "Update docs", priority: "medium" },
              { title: "Improve UI", priority: "low" }
            ]
          })
        }
      }]
    });

    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "High priority: fix bug in payment system by tomorrow. Medium: update documentation. Low: improve UI responsiveness",
    });

    expect(result.success).toBe(true);
    expect(result.tasksCreated).toBe(3);
  });

  it("should extract priority levels from thoughts", async () => {
    const ctx = createAuthContext();
    
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            tasks: [{ title: "Fix critical bug", priority: "high" }]
          })
        }
      }]
    });

    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "Urgent: fix critical bug in authentication",
    });

    expect(result.success).toBe(true);
    expect(result.tasks[0].priority).toBe("high");
  });

  it("should reject empty thoughts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ai.processThought({ thought: "" }))
      .rejects.toThrow();
  });

  it("should create tasks with valid structure", async () => {
    const ctx = createAuthContext();
    
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            tasks: [{ title: "Build new feature", priority: "medium" }]
          })
        }
      }]
    });

    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.processThought({
      thought: "Build new feature for user dashboard",
    });

    expect(result.success).toBe(true);
    expect(result.tasks[0]).toHaveProperty("title", "Build new feature");
    expect(result.tasks[0]).toHaveProperty("priority", "medium");
  });
});

