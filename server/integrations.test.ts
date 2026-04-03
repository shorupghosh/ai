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

describe("Telegram Integration", () => {
  it("should link Telegram chat ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.telegram.linkChatId({ chatId: "123456789" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Telegram linked successfully");
  });

  it("should send daily plan via Telegram", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.telegram.sendDailyPlan({ chatId: "123456789" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Plan sent to Telegram");
  });
});

describe("Google Calendar Integration", () => {
  it("should link Google Calendar account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.linkAccount({ authCode: "auth_code_123" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Google Calendar linked successfully");
  });

  it("should sync task to Google Calendar", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.syncTaskToCalendar({ taskId: 1 });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("event_123");
  });
});

describe("Notifications Router", () => {
  it("should list notifications for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should mark notification as read", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.markAsRead({ id: 1 });

    expect(result.success).toBe(true);
  });

  it("should create habit trigger alert", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.createHabitTriggerAlert({
      habitType: "cigarettes",
      triggerLevel: 8,
      copingStrategy: "Take a 10-minute walk and drink water",
    });

    expect(result.success).toBe(true);
  });

  it("should create habit trigger alert with high urge level", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.createHabitTriggerAlert({
      habitType: "joints",
      triggerLevel: 9,
      copingStrategy: "Call a friend or practice breathing exercises",
    });

    expect(result.success).toBe(true);
  });

  it("should create habit trigger alert for stimulants", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.createHabitTriggerAlert({
      habitType: "stimulant_use",
      triggerLevel: 7,
      copingStrategy: "Meditate or do 20 pushups",
    });

    expect(result.success).toBe(true);
  });
});
