// New Feature Routers: Goals, Journal, Focus Sessions, Achievements, Voice
import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  goals, journal, focusSessions, achievements,
  InsertGoal, InsertJournal, InsertFocusSession, InsertAchievement,
  tasks, habits, sleep, gymDiet, dailyReviews
} from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

// =========== GOALS ROUTER ===========
export const goalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(goals).where(eq(goals.userId, ctx.user.id)).orderBy(desc(goals.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(["health", "career", "personal", "financial", "learning", "fitness"]).optional(),
      targetDate: z.date().optional(),
      milestones: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const insertData: InsertGoal = {
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        category: input.category || "personal",
        targetDate: input.targetDate,
        milestones: input.milestones,
      };
      await db.insert(goals).values(insertData);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(["health", "career", "personal", "financial", "learning", "fitness"]).optional(),
      targetDate: z.date().optional(),
      status: z.enum(["active", "completed", "paused", "abandoned"]).optional(),
      progressPercent: z.string().optional(),
      milestones: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.targetDate !== undefined) updateData.targetDate = input.targetDate;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "completed") updateData.completedAt = new Date();
      }
      if (input.progressPercent !== undefined) updateData.progressPercent = input.progressPercent;
      if (input.milestones !== undefined) updateData.milestones = input.milestones;
      await db.update(goals).set(updateData).where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(goals).where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)));
      return { success: true };
    }),
});

// =========== JOURNAL ROUTER ===========
export const journalRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(journal).where(eq(journal.userId, ctx.user.id)).orderBy(desc(journal.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
      content: z.string().min(1),
      mood: z.number().min(1).max(10).optional(),
      tags: z.string().optional(),
      isGratitude: z.boolean().optional(),
      date: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // AI sentiment analysis
      let sentiment: "positive" | "neutral" | "negative" = "neutral";
      let aiSummary: string | undefined;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Analyze the sentiment and provide a 1-sentence summary. Return JSON: {sentiment: 'positive'|'neutral'|'negative', summary: string}" },
            { role: "user", content: input.content },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sentiment_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                  summary: { type: "string" },
                },
                required: ["sentiment", "summary"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message?.content;
        if (content && typeof content === "string") {
          const parsed = JSON.parse(content);
          sentiment = parsed.sentiment;
          aiSummary = parsed.summary;
        }
      } catch (e) {
        // fallback - no AI analysis
      }

      const insertData: InsertJournal = {
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        mood: input.mood,
        tags: input.tags,
        sentiment,
        aiSummary,
        isGratitude: input.isGratitude || false,
        date: input.date,
      };
      await db.insert(journal).values(insertData);
      return { success: true, sentiment, aiSummary };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(journal).where(and(eq(journal.id, input.id), eq(journal.userId, ctx.user.id)));
      return { success: true };
    }),

  getPrompt: protectedProcedure.query(async () => {
    const prompts = [
      "What are you grateful for today?",
      "What was the highlight of your day?",
      "What challenged you today and how did you handle it?",
      "Describe a moment that made you smile today.",
      "What did you learn about yourself today?",
      "If you could change one thing about today, what would it be?",
      "What's something you're looking forward to tomorrow?",
      "Write about a person who made a difference today.",
      "What emotion dominated your day? Why?",
      "Describe your ideal tomorrow in detail.",
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }),
});

// =========== FOCUS SESSIONS ROUTER ===========
export const focusRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(focusSessions).where(eq(focusSessions.userId, ctx.user.id)).orderBy(desc(focusSessions.startedAt));
  }),

  start: protectedProcedure
    .input(z.object({
      taskId: z.number().optional(),
      duration: z.number().min(1).max(180).default(25),
      type: z.enum(["pomodoro", "deep_work", "custom"]).default("pomodoro"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const insertData: InsertFocusSession = {
        userId: ctx.user.id,
        taskId: input.taskId,
        duration: input.duration,
        type: input.type,
        status: "active",
      };
      await db.insert(focusSessions).values(insertData);
      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
      distractionCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(focusSessions).set({
        status: "completed",
        completedAt: new Date(),
        notes: input.notes,
        distractionCount: input.distractionCount,
      }).where(and(eq(focusSessions.id, input.id), eq(focusSessions.userId, ctx.user.id)));
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(focusSessions).set({ status: "cancelled" }).where(and(eq(focusSessions.id, input.id), eq(focusSessions.userId, ctx.user.id)));
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalMinutes: 0, totalSessions: 0, avgDuration: 0, streak: 0 };
    const sessions = await db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, ctx.user.id), eq(focusSessions.status, "completed")));
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    return {
      totalMinutes,
      totalSessions: sessions.length,
      avgDuration: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
      streak: 0, // calculated client-side for now
    };
  }),
});

// =========== ACHIEVEMENTS ROUTER ===========
export const achievementsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(achievements).where(eq(achievements.userId, ctx.user.id)).orderBy(desc(achievements.unlockedAt));
  }),

  getXP: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalXP: 0, level: 1, title: "Beginner" };
    const userAchievements = await db.select().from(achievements).where(eq(achievements.userId, ctx.user.id));
    const totalXP = userAchievements.reduce((sum, a) => sum + a.xpAwarded, 0);
    const level = Math.floor(totalXP / 500) + 1;
    const titles = ["Beginner", "Apprentice", "Warrior", "Champion", "Master", "Legend", "Mythic"];
    const title = titles[Math.min(level - 1, titles.length - 1)];
    return { totalXP, level, title };
  }),

  checkAndAward: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { newAchievements: [] };

    const existingAchievements = await db.select().from(achievements).where(eq(achievements.userId, ctx.user.id));
    const existingTypes = new Set(existingAchievements.map(a => a.type));
    const newAchievements: InsertAchievement[] = [];

    // Check task milestones
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
    const completedCount = userTasks.filter(t => t.isCompleted).length;

    const taskMilestones = [
      { count: 1, type: "first_task", title: "First Step", icon: "🎯", xp: 50, desc: "Completed your first task" },
      { count: 10, type: "task_10", title: "Getting Started", icon: "⚡", xp: 100, desc: "Completed 10 tasks" },
      { count: 50, type: "task_50", title: "Task Master", icon: "🏅", xp: 250, desc: "Completed 50 tasks" },
      { count: 100, type: "task_100", title: "Centurion", icon: "💯", xp: 500, desc: "Completed 100 tasks" },
    ];

    for (const milestone of taskMilestones) {
      if (completedCount >= milestone.count && !existingTypes.has(milestone.type)) {
        newAchievements.push({
          userId: ctx.user.id,
          type: milestone.type,
          title: milestone.title,
          description: milestone.desc,
          icon: milestone.icon,
          xpAwarded: milestone.xp,
        });
      }
    }

    // Check focus session milestones
    const userSessions = await db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, ctx.user.id), eq(focusSessions.status, "completed")));
    const totalFocusMin = userSessions.reduce((sum, s) => sum + s.duration, 0);

    const focusMilestones = [
      { mins: 25, type: "first_focus", title: "Focused Mind", icon: "🧠", xp: 50, desc: "Completed first focus session" },
      { mins: 300, type: "focus_5h", title: "Deep Thinker", icon: "🔮", xp: 200, desc: "5 hours of focused work" },
      { mins: 1200, type: "focus_20h", title: "Flow State", icon: "🌊", xp: 500, desc: "20 hours of focused work" },
    ];

    for (const milestone of focusMilestones) {
      if (totalFocusMin >= milestone.mins && !existingTypes.has(milestone.type)) {
        newAchievements.push({
          userId: ctx.user.id,
          type: milestone.type,
          title: milestone.title,
          description: milestone.desc,
          icon: milestone.icon,
          xpAwarded: milestone.xp,
        });
      }
    }

    // Check journal milestones
    const userJournals = await db.select().from(journal).where(eq(journal.userId, ctx.user.id));
    if (userJournals.length >= 1 && !existingTypes.has("first_journal")) {
      newAchievements.push({
        userId: ctx.user.id, type: "first_journal", title: "Soul Writer", icon: "📝", xpAwarded: 50, description: "Wrote your first journal entry",
      });
    }
    if (userJournals.length >= 30 && !existingTypes.has("journal_30")) {
      newAchievements.push({
        userId: ctx.user.id, type: "journal_30", title: "Journaling Pro", icon: "📖", xpAwarded: 300, description: "30 journal entries",
      });
    }

    // Insert new achievements
    if (newAchievements.length > 0) {
      await db.insert(achievements).values(newAchievements);
    }

    return { newAchievements: newAchievements.map(a => ({ title: a.title, icon: a.icon, xp: a.xpAwarded })) };
  }),
});

// =========== VOICE ROUTER ===========
export const voiceRouter = router({
  transcribe: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await transcribeAudio(input);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    }),
});

// =========== STREAKS / STATS ROUTER ===========
export const statsRouter = router({
  getStreaks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { taskStreak: 0, reviewStreak: 0, journalStreak: 0, habitFreeStreak: 0 };

    // Task completion streak (consecutive days with at least 1 completed task)
    const completedTasks = await db.select().from(tasks)
      .where(and(eq(tasks.userId, ctx.user.id), eq(tasks.isCompleted, true)));

    const taskDates = new Set(completedTasks.map(t => {
      const d = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
      return d.toISOString().split("T")[0];
    }));

    // Review streak
    const reviews = await db.select().from(dailyReviews).where(eq(dailyReviews.userId, ctx.user.id));
    const reviewDates = new Set(reviews.map(r => new Date(r.date).toISOString().split("T")[0]));

    // Journal streak
    const journals = await db.select().from(journal).where(eq(journal.userId, ctx.user.id));
    const journalDates = new Set(journals.map(j => new Date(j.date).toISOString().split("T")[0]));

    const calcStreak = (dates: Set<string>) => {
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (dates.has(key)) streak++;
        else if (i > 0) break; // allow today to be missing
      }
      return streak;
    };

    return {
      taskStreak: calcStreak(taskDates),
      reviewStreak: calcStreak(reviewDates),
      journalStreak: calcStreak(journalDates),
      habitFreeStreak: 0,
    };
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
    const userHabits = await db.select().from(habits).where(eq(habits.userId, ctx.user.id));
    const userSleep = await db.select().from(sleep).where(eq(sleep.userId, ctx.user.id));
    const userReviews = await db.select().from(dailyReviews).where(eq(dailyReviews.userId, ctx.user.id));
    const userGoals = await db.select().from(goals).where(eq(goals.userId, ctx.user.id));
    const userFocus = await db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, ctx.user.id), eq(focusSessions.status, "completed")));

    // Today's tasks
    const todayCompleted = userTasks.filter(t => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= today;
    }).length;
    const pendingTasks = userTasks.filter(t => !t.isCompleted).length;

    // 7-day mood/energy sparkline
    const last7Days: { date: string; mood: number; energy: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const review = userReviews.find(r => new Date(r.date).toISOString().split("T")[0] === dateStr);
      last7Days.push({ date: dateStr, mood: review?.mood || 0, energy: review?.energy || 0 });
    }

    // Heatmap data (last 365 days activity)
    const heatmapData: { date: string; count: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      let count = 0;
      count += userTasks.filter(t => t.completedAt && new Date(t.completedAt).toISOString().split("T")[0] === dateStr).length;
      count += userHabits.filter(h => new Date(h.date).toISOString().split("T")[0] === dateStr).length;
      count += userReviews.filter(r => new Date(r.date).toISOString().split("T")[0] === dateStr).length ? 1 : 0;
      heatmapData.push({ date: dateStr, count });
    }

    // Focus time this week
    const weekFocusMin = userFocus
      .filter(f => f.completedAt && new Date(f.completedAt) >= sevenDaysAgo)
      .reduce((sum, f) => sum + f.duration, 0);

    // Active goals
    const activeGoals = userGoals.filter(g => g.status === "active").length;

    return {
      todayCompleted,
      pendingTasks,
      activeGoals,
      weekFocusMinutes: weekFocusMin,
      totalTasksCompleted: userTasks.filter(t => t.isCompleted).length,
      moodSparkline: last7Days,
      heatmapData,
    };
  }),

  // AI Coach endpoint
  aiCoach: protectedProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gather context
      const userTasks = await db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
      const userReviews = await db.select().from(dailyReviews).where(eq(dailyReviews.userId, ctx.user.id));
      const userHabits = await db.select().from(habits).where(eq(habits.userId, ctx.user.id));
      const userSleep = await db.select().from(sleep).where(eq(sleep.userId, ctx.user.id));

      const pending = userTasks.filter(t => !t.isCompleted).length;
      const completed = userTasks.filter(t => t.isCompleted).length;
      const recentReview = userReviews[userReviews.length - 1];
      const recentSleep = userSleep[userSleep.length - 1];

      const contextStr = `User context:
- ${pending} pending tasks, ${completed} completed
- Recent mood: ${recentReview?.mood || 'N/A'}/10, energy: ${recentReview?.energy || 'N/A'}/10
- Recent sleep: ${recentSleep?.totalHours || 'N/A'} hours
- Habit log entries: ${userHabits.length}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a warm, insightful AI life coach. You know the user's data:\n${contextStr}\n\nBe conversational, specific, and actionable. Keep responses under 150 words. Use emojis sparingly for warmth.`
          },
          { role: "user", content: input.message },
        ],
      });

      const content = response.choices[0]?.message?.content;
      return { response: typeof content === "string" ? content : "I'm here to help! What's on your mind?" };
    }),
});
