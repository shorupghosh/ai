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

describe("Telegram Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should link Telegram chat ID", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1 }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.telegram.linkChatId({ chatId: "123456789" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Telegram linked successfully");
  });
});

describe("Notifications Router", () => {
  it("should list notifications for user", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1, title: "Test Notify" }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Notify");
  });

  it("should mark notification as read", async () => {
    const ctx = createAuthContext();
    const mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1 }]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.markAsRead({ id: 1 });

    expect(result.success).toBe(true);
  });
});

