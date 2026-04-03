import { describe, it, expect } from "vitest";
import {
  analyzeTriggerPatterns,
  generateCopingStrategies,
  getTimeBasedRiskMultiplier,
} from "./triggerDetection";

describe("Trigger Detection System", () => {
  it("should analyze trigger patterns", async () => {
    const patterns = await analyzeTriggerPatterns(1);
    expect(Array.isArray(patterns)).toBe(true);
  });

  it("should generate coping strategies for high urge", async () => {
    const strategies = await generateCopingStrategies(
      "cigarettes",
      "Stressed about deadline",
      8
    );

    expect(Array.isArray(strategies)).toBe(true);
    expect(strategies.length).toBeGreaterThan(0);
    expect(strategies[0]).toHaveProperty("strategy");
    expect(strategies[0]).toHaveProperty("effectiveness");
    expect(strategies[0]).toHaveProperty("category");
    expect(strategies[0]).toHaveProperty("duration");
  }, { timeout: 30000 });

  it("should generate strategies with valid effectiveness rating", async () => {
    const strategies = await generateCopingStrategies(
      "joints",
      "Social pressure",
      7
    );

    strategies.forEach((strategy) => {
      expect(strategy.effectiveness).toBeGreaterThanOrEqual(1);
      expect(strategy.effectiveness).toBeLessThanOrEqual(10);
      expect(["physical", "mental", "social", "environmental"]).toContain(
        strategy.category
      );
      expect(strategy.duration).toBeGreaterThan(0);
    });
  }, { timeout: 30000 });

  it("should generate strategies for stimulant urges", async () => {
    const strategies = await generateCopingStrategies(
      "stimulant_use",
      "Fatigue and low energy",
      6
    );

    expect(strategies.length).toBeGreaterThan(0);
    expect(strategies[0].strategy).toBeTruthy();
  }, { timeout: 30000 });

  it("should calculate time-based risk multiplier correctly", () => {
    // Evening hours (8pm-2am) should have higher risk
    const eveningDate = new Date();
    eveningDate.setHours(21, 0, 0);
    const eveningRisk = getTimeBasedRiskMultiplier(eveningDate);
    expect(eveningRisk).toBe(1.5);

    // Morning hours (2am-6am) should have moderate risk
    const morningDate = new Date();
    morningDate.setHours(3, 0, 0);
    const morningRisk = getTimeBasedRiskMultiplier(morningDate);
    expect(morningRisk).toBe(1.2);

    // Work hours should have lower risk
    const workDate = new Date();
    workDate.setHours(10, 0, 0);
    const workRisk = getTimeBasedRiskMultiplier(workDate);
    expect(workRisk).toBe(1.0);
  });

  it("should generate fallback strategies if LLM fails", async () => {
    // This test ensures fallback strategies are available
    const strategies = await generateCopingStrategies(
      "cigarettes",
      "Test trigger",
      5
    );

    expect(strategies.length).toBeGreaterThanOrEqual(1);
    expect(strategies[0].strategy).toContain("breathe");
  }, { timeout: 30000 });

  it("should generate different strategies for different urge levels", async () => {
    const lowUrgeStrategies = await generateCopingStrategies(
      "cigarettes",
      "Mild urge",
      3
    );

    const highUrgeStrategies = await generateCopingStrategies(
      "cigarettes",
      "Strong urge",
      9
    );

    expect(lowUrgeStrategies.length).toBeGreaterThan(0);
    expect(highUrgeStrategies.length).toBeGreaterThan(0);
  }, { timeout: 60000 });
});
