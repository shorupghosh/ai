import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Loader2, CheckSquare, Target, Flame, Timer, TrendingUp, Brain, BookOpen, Moon, Dumbbell, Sparkles, ArrowRight, Trophy, Zap, Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useState, useEffect } from "react";

// Greeting based on time of day
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: "Good night", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good evening", emoji: "🌅" };
  return { text: "Good night", emoji: "🌙" };
}

// Contribution Heatmap Component
function ContributionHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const weeks = Math.ceil(data.length / 7);
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/30";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-emerald-200 dark:bg-emerald-900";
    if (intensity < 0.5) return "bg-emerald-400 dark:bg-emerald-700";
    if (intensity < 0.75) return "bg-emerald-500 dark:bg-emerald-600";
    return "bg-emerald-600 dark:bg-emerald-500";
  };

  // Only show last ~20 weeks for display
  const visibleData = data.slice(-140);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-fit">
        {Array.from({ length: Math.ceil(visibleData.length / 7) }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const idx = weekIdx * 7 + dayIdx;
              const item = visibleData[idx];
              return (
                <div
                  key={dayIdx}
                  className={`w-3 h-3 rounded-[2px] transition-colors ${item ? getColor(item.count) : "bg-transparent"}`}
                  title={item ? `${item.date}: ${item.count} activities` : ""}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-muted/30" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-600 dark:bg-emerald-500" />
        <span>More</span>
      </div>
    </div>
  );
}

// Streak Counter Component
function StreakCounter({ label, count, icon, color }: { label: string; count: number; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {count > 0 && <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
    </div>
  );
}

// Sparkline Mini Chart
function MoodSparkline({ data }: { data: { date: string; mood: number; energy: number }[] }) {
  const hasData = data.some(d => d.mood > 0);
  if (!hasData) return <p className="text-xs text-muted-foreground italic">No mood data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12, padding: "4px 8px" }}
          formatter={(val: number, name: string) => [`${val}/10`, name]}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString("en", { weekday: "short" });
          }}
        />
        <Line type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashStats, isLoading: statsLoading } = trpc.stats.getDashboardStats.useQuery();
  const { data: streaks } = trpc.stats.getStreaks.useQuery();
  const { data: xpData } = trpc.achievements.getXP.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();

  const greeting = getGreeting();
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const isLoading = statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
          <p className="text-muted-foreground animate-pulse">Loading your command center...</p>
        </div>
      </div>
    );
  }

  const upcomingTasks = tasks?.filter(t => !t.isCompleted && t.status === "pending")?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            {greeting.emoji} {greeting.text}, <span className="text-gradient">{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{todayStr}</p>
        </div>
        {xpData && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {xpData.level}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{xpData.title}</p>
              <p className="text-xs font-medium">{xpData.totalXP} XP</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tasks Done Today", value: dashStats?.todayCompleted || 0, icon: CheckSquare, gradient: "from-green-500 to-emerald-600", textColor: "text-green-500" },
          { label: "Pending Tasks", value: dashStats?.pendingTasks || 0, icon: Target, gradient: "from-blue-500 to-cyan-600", textColor: "text-blue-500" },
          { label: "Active Goals", value: dashStats?.activeGoals || 0, icon: Trophy, gradient: "from-purple-500 to-pink-600", textColor: "text-purple-500" },
          { label: "Focus This Week", value: `${Math.round((dashStats?.weekFocusMinutes || 0) / 60)}h`, icon: Timer, gradient: "from-orange-500 to-red-600", textColor: "text-orange-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Activity + Mood */}
        <div className="lg:col-span-2 space-y-4">
          {/* Activity Heatmap */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Activity Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashStats?.heatmapData ? (
                  <ContributionHeatmap data={dashStats.heatmapData} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No activity data yet. Start tracking!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood & Energy Sparkline */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" /> Mood & Energy (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-2">
                  <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-purple-500" /> Mood</span>
                  <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Energy</span>
                </div>
                {dashStats?.moodSparkline && <MoodSparkline data={dashStats.moodSparkline} />}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Tasks */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Priority Tasks
              </CardTitle>
              <Link href="/tasks"><Button variant="ghost" size="sm" className="text-xs">View all <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">All caught up! 🎉</p>
              ) : (
                upcomingTasks.map((task, i) => (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"}`} />
                    <span className="text-sm font-medium truncate flex-1">{task.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{task.priority}</Badge>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Streaks + Quick Actions */}
        <div className="space-y-4">
          {/* Streaks */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-100 dark:border-orange-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Streaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StreakCounter label="Task streak" count={streaks?.taskStreak || 0} icon="✅" color="bg-green-100 dark:bg-green-900" />
                <StreakCounter label="Review streak" count={streaks?.reviewStreak || 0} icon="📝" color="bg-blue-100 dark:bg-blue-900" />
                <StreakCounter label="Journal streak" count={streaks?.journalStreak || 0} icon="📖" color="bg-indigo-100 dark:bg-indigo-900" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/focus", icon: Timer, label: "Focus", gradient: "from-orange-500 to-red-500" },
                { href: "/ai-thought", icon: Brain, label: "AI Think", gradient: "from-purple-500 to-pink-500" },
                { href: "/journal", icon: BookOpen, label: "Journal", gradient: "from-indigo-500 to-blue-500" },
                { href: "/daily-review", icon: Calendar, label: "Review", gradient: "from-green-500 to-emerald-500" },
                { href: "/goals", icon: Target, label: "Goals", gradient: "from-yellow-500 to-orange-500" },
                { href: "/habits", icon: Zap, label: "Habits", gradient: "from-red-500 to-pink-500" },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center gap-1.5`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </motion.button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* XP Progress */}
          {xpData && (
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-100 dark:border-yellow-900">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Level {xpData.level}: {xpData.title}</p>
                    <div className="w-full h-2 bg-yellow-200 dark:bg-yellow-800 rounded-full mt-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xpData.totalXP % 500) / 5}%` }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{xpData.totalXP % 500} / 500 XP to next level</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
