import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeTriggerPatterns,
  generateCopingStrategies,
  getTimeBasedRiskMultiplier,
} from "./triggerDetection";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock schema Since it's used in analyzeTriggerPatterns
vi.mock("../drizzle/schema", () => ({
  habits: { id: "id", userId: "userId", habitType: "habitType", date: "date", urgeLevel: "urgeLevel" },
  notifications: { id: "id" },
  dailyReviews: { id: "id" },
}));

describe("Trigger Detection System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze trigger patterns", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { habitType: "cigarettes", urgeLevel: 8, date: new Date() },
        { habitType: "cigarettes", urgeLevel: 6, date: new Date() }
      ]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const patterns = await analyzeTriggerPatterns(1);
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns[0].habitType).toBe("cigarettes");
    expect(patterns[0].maxUrgeLevel).toBe(8);
  });

  const mockStrategies = [
    { strategy: "Deep Breathing", effectiveness: 9, category: "physical", duration: 5 }
  ];

  it("should generate coping strategies for high urge", async () => {
    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockStrategies) }
      }]
    });

    const strategies = await generateCopingStrategies(
      "cigarettes",
      "Stressed about deadline",
      8
    );

    expect(Array.isArray(strategies)).toBe(true);
    expect(strategies.length).toBeGreaterThan(0);
    expect(strategies[0].strategy).toBe("Deep Breathing");
  });

  it("should generate strategies with valid effectiveness rating", async () => {
    (invokeLLM as any).mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify(mockStrategies) }
      }]
    });

    const strategies = await generateCopingStrategies(
      "joints",
      "Social pressure",
      7
    );

    strategies.forEach((strategy) => {
      expect(strategy.effectiveness).toBeGreaterThanOrEqual(1);
      expect(strategy.effectiveness).toBeLessThanOrEqual(10);
    });
  });

  it("should calculate time-based risk multiplier correctly", () => {
    const eveningDate = new Date();
    eveningDate.setHours(21, 0, 0);
    expect(getTimeBasedRiskMultiplier(eveningDate)).toBe(1.5);

    const workDate = new Date();
    workDate.setHours(10, 0, 0);
    expect(getTimeBasedRiskMultiplier(workDate)).toBe(1.0);
  });

  it("should return fallback strategies if LLM fails", async () => {
    (invokeLLM as any).mockRejectedValue(new Error("LLM Down"));

    const strategies = await generateCopingStrategies(
      "cigarettes",
      "Test trigger",
      5
    );

    expect(strategies.length).toBeGreaterThanOrEqual(1);
    expect(strategies[0].strategy).toContain("breaths");
  });
});

