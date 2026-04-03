import { getDb } from "./db";
import { habits, notifications, dailyReviews } from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

export interface TriggerPattern {
  habitType: string;
  averageUrgeLevel: number;
  maxUrgeLevel: number;
  frequency: number;
  lastOccurrence: Date;
  commonTriggers: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface CopingStrategy {
  strategy: string;
  effectiveness: number;
  category: string;
  duration: number; // in minutes
}

/**
 * Analyze habit patterns for a user to detect high-risk triggers
 */
export async function analyzeTriggerPatterns(userId: number): Promise<TriggerPattern[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get habit logs from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), gte(habits.date, thirtyDaysAgo)))
    .orderBy(desc(habits.date));

  // Group by habit type and analyze patterns
  const patterns: Map<string, TriggerPattern> = new Map();

  for (const habit of recentHabits) {
    const key = habit.habitType;
    if (!patterns.has(key)) {
      patterns.set(key, {
        habitType: key,
        averageUrgeLevel: 0,
        maxUrgeLevel: 0,
        frequency: 0,
        lastOccurrence: habit.date,
        commonTriggers: [],
        riskLevel: "low",
      });
    }

    const pattern = patterns.get(key)!;
    pattern.frequency += 1;
    pattern.maxUrgeLevel = Math.max(pattern.maxUrgeLevel, habit.urgeLevel || 0);
    pattern.lastOccurrence = habit.date;

    if (habit.triggerNotes) {
      pattern.commonTriggers.push(habit.triggerNotes);
    }
  }

  // Calculate averages and determine risk levels
  const result: TriggerPattern[] = [];

  for (const [habitTypeKey, pattern] of Array.from(patterns.entries())) {
    const totalUrge = recentHabits
      .filter((h) => h.habitType === habitTypeKey)
      .reduce((sum, h) => sum + (h.urgeLevel || 0), 0);

    pattern.averageUrgeLevel = totalUrge / pattern.frequency;

    // Determine risk level based on metrics
    if (pattern.maxUrgeLevel >= 9 || pattern.averageUrgeLevel >= 7) {
      pattern.riskLevel = "critical";
    } else if (pattern.maxUrgeLevel >= 7 || pattern.averageUrgeLevel >= 5.5) {
      pattern.riskLevel = "high";
    } else if (pattern.maxUrgeLevel >= 5 || pattern.averageUrgeLevel >= 4) {
      pattern.riskLevel = "medium";
    } else {
      pattern.riskLevel = "low";
    }

    // Get most common triggers
    const triggerCounts = new Map<string, number>();
    pattern.commonTriggers.forEach((trigger: string) => {
      triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1);
    });

    pattern.commonTriggers = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trigger]) => trigger);

    result.push(pattern);
  }

  return result;
}

/**
 * Generate AI-powered coping strategies based on habit patterns
 */
export async function generateCopingStrategies(
  habitType: string,
  triggerNotes: string,
  urgeLevel: number
): Promise<CopingStrategy[]> {
  const prompt = `You are a harm reduction and addiction recovery specialist. Generate 3 evidence-based coping strategies for someone experiencing a ${urgeLevel}/10 urge level for ${habitType} use.

Context: The trigger is: "${triggerNotes}"

For each strategy, provide:
1. A specific, actionable coping strategy
2. Expected effectiveness (1-10)
3. Category (physical, mental, social, environmental)
4. Estimated duration in minutes

Format your response as a JSON array with objects containing: strategy, effectiveness, category, duration

Make strategies practical, immediate, and evidence-based (e.g., 4-7-8 breathing, cold water immersion, calling support, changing environment).`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a harm reduction specialist. Generate practical, evidence-based coping strategies.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coping_strategies",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                strategy: { type: "string", description: "The coping strategy" },
                effectiveness: {
                  type: "integer",
                  description: "Effectiveness rating 1-10",
                  minimum: 1,
                  maximum: 10,
                },
                category: {
                  type: "string",
                  enum: ["physical", "mental", "social", "environmental"],
                },
                duration: { type: "integer", description: "Duration in minutes" },
              },
              required: ["strategy", "effectiveness", "category", "duration"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const strategies = JSON.parse(content) as CopingStrategy[];
    return strategies.slice(0, 3); // Return top 3 strategies
  } catch (error) {
    console.error("Error generating coping strategies:", error);
    // Return fallback strategies
    return [
      {
        strategy: "Take 5 deep breaths (4-7-8 technique: inhale 4s, hold 7s, exhale 8s)",
        effectiveness: 8,
        category: "physical",
        duration: 5,
      },
      {
        strategy: "Call a trusted friend or support person",
        effectiveness: 9,
        category: "social",
        duration: 10,
      },
      {
        strategy: "Change your environment - go for a walk or move to a different room",
        effectiveness: 7,
        category: "environmental",
        duration: 15,
      },
    ];
  }
}

/**
 * Create a trigger alert for high-risk situations
 */
export async function createTriggerAlert(
  userId: number,
  habitType: string,
  urgeLevel: number,
  triggerNotes: string,
  copingStrategies: CopingStrategy[]
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const strategyText = copingStrategies
    .map(
      (s, i) =>
        `${i + 1}. ${s.strategy} (${s.duration}min, effectiveness: ${s.effectiveness}/10)`
    )
    .join("\n");

  await db.insert(notifications).values({
    userId,
    type: "habit_trigger",
    title: `⚠️ High ${habitType} Urge Detected (${urgeLevel}/10)`,
    message: `You're experiencing a ${urgeLevel}/10 urge level. Trigger: ${triggerNotes}. Try one of these strategies now.`,
    habitType,
    triggerLevel: urgeLevel,
    copingStrategy: strategyText,
  });

  return userId; // Return user ID as notification ID
}

/**
 * Check if user needs a proactive alert based on patterns
 */
export async function shouldSendProactiveAlert(
  userId: number,
  patterns: TriggerPattern[]
): Promise<boolean> {
  // Send proactive alerts if:
  // 1. Any pattern is at "critical" or "high" risk level
  // 2. User has logged habits in the last 7 days (active tracking)
  // 3. No alert sent in the last 6 hours

  const db = await getDb();
  if (!db) return false;

  const hasHighRiskPattern = patterns.some((p) => p.riskLevel === "critical" || p.riskLevel === "high");
  if (!hasHighRiskPattern) return false;

  // Check if user has recent habit logs
  const sixHoursAgo = new Date();
  sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

  const recentHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), gte(habits.date, sixHoursAgo)))
    .limit(1);

  return recentHabits.length > 0;
}

/**
 * Get time-based trigger risk (higher risk at certain times)
 */
export function getTimeBasedRiskMultiplier(date: Date): number {
  const hour = date.getHours();

  // Higher risk during evening/night hours (8pm-2am)
  if (hour >= 20 || hour < 2) {
    return 1.5;
  }

  // Moderate risk in early morning (2am-6am) and afternoon (2pm-4pm)
  if ((hour >= 2 && hour < 6) || (hour >= 14 && hour < 16)) {
    return 1.2;
  }

  // Lower risk during work/active hours
  return 1.0;
}

/**
 * Analyze mood/energy correlation with urges
 */
export async function analyzeMoodTriggerCorrelation(
  userId: number,
  habitType: string
): Promise<{ lowMoodTrigger: boolean; lowEnergyTrigger: boolean }> {
  const db = await getDb();
  if (!db) {
    return { lowMoodTrigger: false, lowEnergyTrigger: false };
  }

  // Get recent daily reviews
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const reviews = await db
    .select()
    .from(dailyReviews)
    .where(and(eq(dailyReviews.userId, userId), gte(dailyReviews.date, thirtyDaysAgo)));

  // Get habit logs for same period
  const allHabitLogs = await db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        gte(habits.date, thirtyDaysAgo)
      )
    );
  
  const habitLogs = allHabitLogs.filter(log => log.habitType === habitType);

  if (reviews.length === 0 || habitLogs.length === 0) {
    return { lowMoodTrigger: false, lowEnergyTrigger: false };
  }

  // Calculate average mood and energy on days with high urges
  const highUrgeHabits = habitLogs.filter((h) => h.urgeLevel && h.urgeLevel >= 7);

  if (highUrgeHabits.length === 0) {
    return { lowMoodTrigger: false, lowEnergyTrigger: false };
  }

  const avgMoodOnHighUrge =
    highUrgeHabits.reduce((sum, h) => {
      const review = reviews.find(
        (r) =>
          new Date(r.date).toDateString() === new Date(h.date).toDateString()
      );
      return sum + (review?.mood || 5);
    }, 0) / highUrgeHabits.length;

  const avgEnergyOnHighUrge =
    highUrgeHabits.reduce((sum, h) => {
      const review = reviews.find(
        (r) =>
          new Date(r.date).toDateString() === new Date(h.date).toDateString()
      );
      return sum + (review?.energy || 5);
    }, 0) / highUrgeHabits.length;

  return {
    lowMoodTrigger: avgMoodOnHighUrge < 5,
    lowEnergyTrigger: avgEnergyOnHighUrge < 5,
  };
}
