import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getDb, upsertUser, getUserByOpenId } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const db = await getDb();
    if (db) {
      user = (await getUserByOpenId("local-dev-user")) ?? null;
      if (!user) {
        await upsertUser({
          openId: "local-dev-user",
          name: "Local Dev User",
          email: "local@example.com",
          loginMethod: "local",
          role: "admin",
        });
        user = await getUserByOpenId("local-dev-user") ?? null;
      }
    }
  } catch (error) {
    console.error("[Context] Error getting user:", error);
    user = null;
  }

  // FORCE MOCK USER if missing
  if (!user) {
    user = {
      id: 1,
      openId: "local-dev-user",
      name: "Mock Admin",
      email: "admin@local.dev",
      role: "admin",
      loginMethod: "local",
      telegramChatId: null,
      googleCalendarToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date()
    } as User;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
