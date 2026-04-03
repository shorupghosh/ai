// Trigger Detection Router
import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  analyzeTriggerPatterns,
  generateCopingStrategies,
  createTriggerAlert,
  shouldSendProactiveAlert,
  getTimeBasedRiskMultiplier,
  analyzeMoodTriggerCorrelation,
} from "./triggerDetection";

export const triggerDetectionRouter = router({
  analyzeTriggers: protectedProcedure.query(async ({ ctx }) => {
    const patterns = await analyzeTriggerPatterns(ctx.user.id);
    return {
      patterns,
      summary: {
        totalPatterns: patterns.length,
        criticalCount: patterns.filter((p) => p.riskLevel === "critical").length,
        highCount: patterns.filter((p) => p.riskLevel === "high").length,
        needsAlert: patterns.some((p) => p.riskLevel === "critical" || p.riskLevel === "high"),
      },
    };
  }),

  generateStrategies: protectedProcedure
    .input(
      z.object({
        habitType: z.string(),
        triggerNotes: z.string(),
        urgeLevel: z.number().min(1).max(10),
      })
    )
    .query(async ({ input }) => {
      const strategies = await generateCopingStrategies(
        input.habitType,
        input.triggerNotes,
        input.urgeLevel
      );
      return {
        strategies,
        timeBasedRisk: getTimeBasedRiskMultiplier(new Date()),
        recommendation: strategies[0]?.strategy || "Take a moment to breathe",
      };
    }),

  sendAlert: protectedProcedure
    .input(
      z.object({
        habitType: z.string(),
        urgeLevel: z.number().min(1).max(10),
        triggerNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const strategies = await generateCopingStrategies(
        input.habitType,
        input.triggerNotes,
        input.urgeLevel
      );

      await createTriggerAlert(
        ctx.user.id,
        input.habitType,
        input.urgeLevel,
        input.triggerNotes,
        strategies
      );

      return {
        success: true,
        strategies,
        message: `Alert sent with ${strategies.length} coping strategies`,
      };
    }),

  checkProactiveAlert: protectedProcedure.query(async ({ ctx }) => {
    const patterns = await analyzeTriggerPatterns(ctx.user.id);
    const shouldAlert = await shouldSendProactiveAlert(ctx.user.id, patterns);

    if (shouldAlert) {
      const criticalPatterns = patterns.filter((p) => p.riskLevel === "critical");
      if (criticalPatterns.length > 0) {
        const pattern = criticalPatterns[0];
        const moodCorrelation = await analyzeMoodTriggerCorrelation(
          ctx.user.id,
          pattern.habitType
        );

        return {
          shouldAlert: true,
          pattern,
          moodCorrelation,
          message: `High-risk pattern detected for ${pattern.habitType}`,
        };
      }
    }

    return {
      shouldAlert: false,
      pattern: null,
      moodCorrelation: null,
      message: "No immediate alerts needed",
    };
  }),

  getMoodCorrelation: protectedProcedure
    .input(z.object({ habitType: z.string() }))
    .query(async ({ ctx, input }) => {
      const correlation = await analyzeMoodTriggerCorrelation(ctx.user.id, input.habitType);
      return {
        habitType: input.habitType,
        lowMoodTrigger: correlation.lowMoodTrigger,
        lowEnergyTrigger: correlation.lowEnergyTrigger,
        insights: {
          moodInsight: correlation.lowMoodTrigger
            ? "Your urges increase when mood is low. Consider mood-boosting activities."
            : "Mood doesn't seem to be a primary trigger for you.",
          energyInsight: correlation.lowEnergyTrigger
            ? "Your urges increase when energy is low. Prioritize rest and nutrition."
            : "Energy levels don't seem to be a primary trigger for you.",
        },
      };
    }),
});
