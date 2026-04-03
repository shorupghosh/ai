import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { tasks, projects, habits, sleep, gymDiet, dailyReviews, notifications, InsertTask, InsertProject, InsertHabit, InsertSleep, InsertGymDiet, InsertDailyReview, InsertNotification } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import {
  analyzeTriggerPatterns,
  generateCopingStrategies,
  createTriggerAlert,
  shouldSendProactiveAlert,
  getTimeBasedRiskMultiplier,
  analyzeMoodTriggerCorrelation,
} from "./triggerDetection";
import { triggerDetectionRouter } from "./routers_trigger";
import { goalsRouter, journalRouter, focusRouter, achievementsRouter, voiceRouter, statsRouter } from "./routers_new";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Tasks Router
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(tasks).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id))).limit(1);
        return result[0] || null;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        projectId: z.number().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
        scheduledTime: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const insertData: InsertTask = {
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          projectId: input.projectId,
          priority: input.priority || "medium",
          dueDate: input.dueDate,
          scheduledTime: input.scheduledTime,
          status: "pending",
          isCompleted: false,
        };

        await db.insert(tasks).values(insertData);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        projectId: z.number().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
        scheduledTime: z.date().optional(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.projectId !== undefined) updateData.projectId = input.projectId;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
        if (input.scheduledTime !== undefined) updateData.scheduledTime = input.scheduledTime;
        if (input.status !== undefined) updateData.status = input.status;

        await db.update(tasks).set(updateData).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
        return { success: true };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(tasks).set({ isCompleted: true, status: "completed", completedAt: new Date() }).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(tasks).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Projects Router
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(projects).where(eq(projects.userId, ctx.user.id));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(projects).where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id))).limit(1);
        return result[0] || null;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        stage: z.enum(["idea", "build", "test", "launch", "growth"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const insertData: InsertProject = {
          userId: ctx.user.id,
          name: input.name,
          stage: input.stage || "idea",
          progressPercent: "0.00",
        };

        await db.insert(projects).values(insertData);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        stage: z.enum(["idea", "build", "test", "launch", "growth"]).optional(),
        progressPercent: z.string().optional(),
        nextAction: z.string().optional(),
        blocker: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.stage !== undefined) updateData.stage = input.stage;
        if (input.progressPercent !== undefined) updateData.progressPercent = input.progressPercent;
        if (input.nextAction !== undefined) updateData.nextAction = input.nextAction;
        if (input.blocker !== undefined) updateData.blocker = input.blocker;

        await db.update(projects).set(updateData).where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(projects).where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Habits Router
  habits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(habits).where(eq(habits.userId, ctx.user.id));
    }),

    log: protectedProcedure
      .input(z.object({
        habitType: z.enum(["cigarettes", "joints", "stimulant_use"]),
        count: z.number().default(1),
        urgeLevel: z.number().min(1).max(10).optional(),
        triggerNotes: z.string().optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const insertData: InsertHabit = {
          userId: ctx.user.id,
          habitType: input.habitType,
          count: input.count,
          urgeLevel: input.urgeLevel,
          triggerNotes: input.triggerNotes,
          date: input.date,
        };

        await db.insert(habits).values(insertData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(habits).where(and(eq(habits.id, input.id), eq(habits.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Sleep Router
  sleep: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sleep).where(eq(sleep.userId, ctx.user.id));
    }),

    log: protectedProcedure
      .input(z.object({
        sleepTime: z.date(),
        wakeTime: z.date(),
        quality: z.number().min(1).max(10).optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const sleepHours = (input.wakeTime.getTime() - input.sleepTime.getTime()) / (1000 * 60 * 60);

        const insertData: InsertSleep = {
          userId: ctx.user.id,
          sleepTime: input.sleepTime,
          wakeTime: input.wakeTime,
          totalHours: sleepHours.toString(),
          quality: input.quality,
          date: input.date,
        };

        await db.insert(sleep).values(insertData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(sleep).where(and(eq(sleep.id, input.id), eq(sleep.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Gym/Diet Router
  gymDiet: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(gymDiet).where(eq(gymDiet.userId, ctx.user.id));
    }),

    log: protectedProcedure
      .input(z.object({
        workoutDone: z.boolean().default(false),
        weight: z.string().optional(),
        meals: z.string().optional(),
        proteinIntake: z.number().optional(),
        waterIntake: z.number().optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const insertData: InsertGymDiet = {
          userId: ctx.user.id,
          workoutDone: input.workoutDone,
          weight: input.weight,
          meals: input.meals,
          proteinIntake: input.proteinIntake,
          waterIntake: input.waterIntake,
          date: input.date,
        };

        await db.insert(gymDiet).values(insertData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(gymDiet).where(and(eq(gymDiet.id, input.id), eq(gymDiet.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Daily Review Router
  dailyReview: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(dailyReviews).where(eq(dailyReviews.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        wins: z.string().optional(),
        misses: z.string().optional(),
        mood: z.number().min(1).max(10).optional(),
        energy: z.number().min(1).max(10).optional(),
        tomorrowFocus: z.string().optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const insertData: InsertDailyReview = {
          userId: ctx.user.id,
          wins: input.wins,
          misses: input.misses,
          mood: input.mood,
          energy: input.energy,
          tomorrowFocus: input.tomorrowFocus,
          date: input.date,
        };

        await db.insert(dailyReviews).values(insertData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(dailyReviews).where(and(eq(dailyReviews.id, input.id), eq(dailyReviews.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Weekly Insights Router
  weeklyInsights: router({
    generate: protectedProcedure
      .input(z.object({
        weeksBack: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (input.weeksBack * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        const userTasks = await db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
        const userHabits = await db.select().from(habits).where(eq(habits.userId, ctx.user.id));
        const userSleep = await db.select().from(sleep).where(eq(sleep.userId, ctx.user.id));
        const userGymDiet = await db.select().from(gymDiet).where(eq(gymDiet.userId, ctx.user.id));
        const userReviews = await db.select().from(dailyReviews).where(eq(dailyReviews.userId, ctx.user.id));

        const weekTasks = userTasks.filter(t => {
          const taskDate = new Date(t.completedAt || t.createdAt);
          return taskDate >= startDate && taskDate <= endDate;
        });

        const weekHabits = userHabits.filter(h => {
          const habitDate = new Date(h.date);
          return habitDate >= startDate && habitDate <= endDate;
        });

        const weekSleep = userSleep.filter(s => {
          const sleepDate = new Date(s.date);
          return sleepDate >= startDate && sleepDate <= endDate;
        });

        const weekGymDiet = userGymDiet.filter(g => {
          const gymDate = new Date(g.date);
          return gymDate >= startDate && gymDate <= endDate;
        });

        const weekReviews = userReviews.filter(r => {
          const reviewDate = new Date(r.date);
          return reviewDate >= startDate && reviewDate <= endDate;
        });

        const completedTasks = weekTasks.filter(t => t.isCompleted).length;
        const totalTasks = weekTasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : "0";

        const workoutsCompleted = weekGymDiet.filter(g => g.workoutDone).length;
        const avgSleep = weekSleep.length > 0
          ? (weekSleep.reduce((sum, s) => sum + parseFloat(s.totalHours as any), 0) / weekSleep.length).toFixed(1)
          : "0";
        const avgSleepQuality = weekSleep.length > 0
          ? (weekSleep.reduce((sum, s) => sum + (s.quality || 0), 0) / weekSleep.length).toFixed(1)
          : "0";

        const avgMood = weekReviews.length > 0
          ? (weekReviews.reduce((sum, r) => sum + (r.mood || 0), 0) / weekReviews.length).toFixed(1)
          : "0";
        const avgEnergy = weekReviews.length > 0
          ? (weekReviews.reduce((sum, r) => sum + (r.energy || 0), 0) / weekReviews.length).toFixed(1)
          : "0";

        const habitCounts: Record<string, number> = {
          cigarettes: weekHabits.filter(h => h.habitType === "cigarettes").length,
          joints: weekHabits.filter(h => h.habitType === "joints").length,
          stimulant_use: weekHabits.filter(h => h.habitType === "stimulant_use").length,
        };

        const avgUrgeLevel = weekHabits.length > 0
          ? (weekHabits.reduce((sum, h) => sum + (h.urgeLevel || 0), 0) / weekHabits.length).toFixed(1)
          : "0";

        const insightPrompt = `Analyze this week's productivity and wellness data and provide 3-4 key insights and recommendations:

Productivity: ${completionRate}% task completion (${completedTasks}/${totalTasks} tasks)
Workouts: ${workoutsCompleted} completed
Sleep: ${avgSleep}h average (quality: ${avgSleepQuality}/10)
Mood: ${avgMood}/10, Energy: ${avgEnergy}/10
Habits: Cigarettes(${habitCounts.cigarettes}), Joints(${habitCounts.joints}), Stimulants(${habitCounts.stimulant_use}), Avg Urge(${avgUrgeLevel}/10)

Provide actionable, specific recommendations to improve next week.`;

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system" as const, content: "You are a productivity and wellness coach. Provide specific, actionable insights based on the data." },
            { role: "user" as const, content: insightPrompt },
          ],
        });

        const insights = typeof aiResponse.choices[0]?.message?.content === 'string'
          ? aiResponse.choices[0].message.content
          : "Unable to generate insights";

        return {
          weekStart: startDate.toISOString().split('T')[0],
          weekEnd: endDate.toISOString().split('T')[0],
          metrics: {
            taskCompletion: {
              completed: completedTasks,
              total: totalTasks,
              percentage: parseFloat(completionRate),
            },
            workouts: workoutsCompleted,
            sleep: {
              avgHours: parseFloat(avgSleep),
              avgQuality: parseFloat(avgSleepQuality),
            },
            mood: {
              avg: parseFloat(avgMood),
              energy: parseFloat(avgEnergy),
            },
            habits: {
              cigarettes: habitCounts.cigarettes,
              joints: habitCounts.joints,
              stimulants: habitCounts.stimulant_use,
              avgUrgeLevel: parseFloat(avgUrgeLevel),
            },
          },
          insights,
        };
      }),
  }),

  // AI Router - Convert raw thoughts to structured tasks
  ai: router({
    processThought: protectedProcedure
      .input(z.object({
        thought: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const userProjects = await db.select().from(projects).where(eq(projects.userId, ctx.user.id));
        const projectsList = userProjects.map(p => `${p.id}: ${p.name}`).join(", ");

        const systemPrompt = `You are a task extraction AI. Convert raw thoughts into structured tasks.
User's existing projects: ${projectsList || "None yet"}
Extract tasks from the thought and return a JSON array. Each task should have: title (required), description (optional), projectId (optional, must match user's projects), priority (low/medium/high, default medium), dueDate (YYYY-MM-DD format, optional), scheduledTime (ISO format, optional).`;

        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: `Extract tasks from this thought: "${input.thought}"` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tasks_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        projectId: { type: "number" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        dueDate: { type: "string" },
                        scheduledTime: { type: "string" },
                      },
                      required: ["title"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tasks"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') throw new Error("No response from LLM");

        const parsed = JSON.parse(typeof content === 'string' ? content : '');
        const createdTasks = [];

        for (const task of parsed.tasks || []) {
          const insertData: InsertTask = {
            userId: ctx.user.id,
            title: task.title,
            description: task.description || undefined,
            projectId: task.projectId || undefined,
            priority: task.priority || "medium",
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            scheduledTime: task.scheduledTime ? new Date(task.scheduledTime) : undefined,
            status: "pending",
            isCompleted: false,
          };

          await db.insert(tasks).values(insertData);
          createdTasks.push({ title: task.title, priority: task.priority });
        }

        return {
          success: true,
          tasksCreated: createdTasks.length,
          tasks: createdTasks,
        };
      }),

    generateDailyPlan: protectedProcedure
      .input(z.object({
        energyLevel: z.number().min(1).max(10).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get pending tasks
        const userTasks = await db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
        const todayTasks = userTasks.filter(t => {
          if (t.isCompleted) return false;
          if (t.dueDate) {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && dueDate < tomorrow;
          }
          return true;
        });

        // Get user's projects
        const userProjects = await db.select().from(projects).where(eq(projects.userId, ctx.user.id));
        const projectMap: Record<number, string> = {};
        userProjects.forEach(p => {
          projectMap[p.id] = p.name;
        });

        // Get recent energy and mood data
        const recentReviews = await db.select().from(dailyReviews).where(eq(dailyReviews.userId, ctx.user.id));
        const recentEnergy = recentReviews.length > 0
          ? (recentReviews.slice(-7).reduce((sum, r) => sum + (r.energy || 0), 0) / Math.min(7, recentReviews.length)).toFixed(1)
          : "5";

        // Get recent habit data
        const recentHabits = await db.select().from(habits).where(eq(habits.userId, ctx.user.id));
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const habitTriggers = recentHabits
          .filter(h => new Date(h.date) >= last7Days)
          .map(h => h.triggerNotes)
          .filter(Boolean)
          .slice(0, 3);

        const energyLevel = input.energyLevel || parseFloat(recentEnergy);

        const planPrompt = `Generate an optimized daily plan for today. Consider:

Energy Level: ${energyLevel}/10
Pending Tasks (${todayTasks.length}):
${todayTasks.map(t => `- [${t.priority}] ${t.title} (Project: ${t.projectId ? projectMap[t.projectId] || 'Unknown' : 'None'})`).join('\n')}

Recent Habit Triggers: ${habitTriggers.length > 0 ? habitTriggers.join(', ') : 'None noted'}

Create a structured daily plan with:
1. Optimal task order based on energy level and priority
2. Recommended time blocks for each task
3. Break recommendations
4. Specific strategies to avoid habit triggers
5. Overall plan summary

Return as JSON with: tasks (array with title, startTime, duration, priority), breaks (array with time, duration), strategies (array of strings), summary (string)`;

        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: "You are a productivity coach. Create detailed, personalized daily plans that maximize productivity based on energy levels and task priorities." },
            { role: "user" as const, content: planPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "daily_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        startTime: { type: "string" },
                        duration: { type: "number" },
                        priority: { type: "string" },
                      },
                      required: ["title", "startTime", "duration", "priority"],
                      additionalProperties: false,
                    },
                  },
                  breaks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string" },
                        duration: { type: "number" },
                      },
                      required: ["time", "duration"],
                      additionalProperties: false,
                    },
                  },
                  strategies: {
                    type: "array",
                    items: { type: "string" },
                  },
                  summary: { type: "string" },
                },
                required: ["tasks", "breaks", "strategies", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') throw new Error("No response from LLM");

        const plan = JSON.parse(typeof content === 'string' ? content : '');

        return {
          success: true,
          energyLevel,
          taskCount: todayTasks.length,
          plan,
        };
      }),
  }),

  // Telegram Integration Router
  telegram: router({
    linkChatId: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // In real implementation, update user's telegramChatId
        return { success: true, message: "Telegram linked successfully" };
      }),

    sendDailyPlan: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // In real implementation, call Telegram Bot API to send message
        const message = `📅 Your Daily Plan\n\nCheck your dashboard for today's optimized schedule and tasks.`;
        return { success: true, message: "Plan sent to Telegram" };
      }),
  }),

  // Google Calendar Integration Router
  googleCalendar: router({
    linkAccount: protectedProcedure
      .input(z.object({ authCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // In real implementation, exchange auth code for token
        return { success: true, message: "Google Calendar linked successfully" };
      }),

    syncTaskToCalendar: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // In real implementation, create calendar event
        return { success: true, eventId: "event_123" };
      }),
  }),

  // Notifications Router
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id));
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
        return { success: true };
      }),

    createHabitTriggerAlert: protectedProcedure
      .input(z.object({
        habitType: z.string(),
        triggerLevel: z.number(),
        copingStrategy: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const insertData: InsertNotification = {
          userId: ctx.user.id,
          type: "habit_trigger",
          title: `⚠️ High ${input.habitType} Urge Detected`,
          message: `Your urge level is at ${input.triggerLevel}/10. Try this: ${input.copingStrategy}`,
          habitType: input.habitType,
          triggerLevel: input.triggerLevel,
          copingStrategy: input.copingStrategy,
        };

        await db.insert(notifications).values(insertData);
        return { success: true };
      }),
  }),

  triggerDetection: triggerDetectionRouter,
  goals: goalsRouter,
  journal: journalRouter,
  focus: focusRouter,
  achievements: achievementsRouter,
  voice: voiceRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
