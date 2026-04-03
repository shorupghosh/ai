import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2, TrendingUp, Target, Heart, Moon, Zap } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Streamdown } from "streamdown";

export default function WeeklyInsightsPage() {
  const [weeksBack, setWeeksBack] = useState(0);
  const { data: insights, isLoading } = trpc.weeklyInsights.generate.useQuery({ weeksBack });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Generating insights...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Weekly Insights
          </h1>
          <p className="text-muted-foreground">No data available for this week yet</p>
        </div>
      </div>
    );
  }

  const taskData = [
    { name: "Completed", value: insights.metrics.taskCompletion.completed, fill: "#10b981" },
    { name: "Pending", value: insights.metrics.taskCompletion.total - insights.metrics.taskCompletion.completed, fill: "#ef4444" },
  ];

  const habitData = [
    { name: "Cigarettes", value: insights.metrics.habits.cigarettes },
    { name: "Joints", value: insights.metrics.habits.joints },
    { name: "Stimulants", value: insights.metrics.habits.stimulants },
  ];

  const wellnessData = [
    { metric: "Sleep", value: insights.metrics.sleep.avgHours, max: 10, icon: Moon, color: "text-purple-600" },
    { metric: "Sleep Quality", value: insights.metrics.sleep.avgQuality, max: 10, icon: Heart, color: "text-red-600" },
    { metric: "Mood", value: insights.metrics.mood.avg, max: 10, icon: Zap, color: "text-yellow-600" },
    { metric: "Energy", value: insights.metrics.mood.energy, max: 10, icon: Zap, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Weekly Insights
          </h1>
          <p className="text-muted-foreground">
            Week of {insights.weekStart} to {insights.weekEnd}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setWeeksBack(Math.max(0, weeksBack - 1))}
            disabled={weeksBack === 0}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setWeeksBack(weeksBack + 1)}
          >
            Next Week
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{insights.metrics.taskCompletion.percentage.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.metrics.taskCompletion.completed} of {insights.metrics.taskCompletion.total} tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{insights.metrics.workouts}</div>
                <p className="text-xs text-muted-foreground mt-1">Sessions completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{insights.metrics.sleep.avgHours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground mt-1">Quality: {insights.metrics.sleep.avgQuality.toFixed(1)}/10</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Mood & Energy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{insights.metrics.mood.avg.toFixed(1)}/10</div>
                <p className="text-xs text-muted-foreground mt-1">Energy: {insights.metrics.mood.energy.toFixed(1)}/10</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Rate</CardTitle>
              <CardDescription>Completed vs Pending tasks this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Habit Tracking</CardTitle>
              <CardDescription>Habit occurrences this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={habitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wellness" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wellnessData.map((item) => {
              const Icon = item.icon;
              const percentage = (item.value / item.max) * 100;
              return (
                <Card key={item.metric}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      {item.metric}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold">{item.value.toFixed(1)}/{item.max}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Habit Urge Levels</CardTitle>
              <CardDescription>Average urge level this week: {insights.metrics.habits.avgUrgeLevel.toFixed(1)}/10</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Urge Intensity</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-600 h-3 rounded-full transition-all"
                      style={{ width: `${(insights.metrics.habits.avgUrgeLevel / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>Personalized insights based on your weekly data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{insights.insights}</Streamdown>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900">✓ Strengths</p>
                  <p className="text-xs text-green-700 mt-1">
                    {insights.metrics.taskCompletion.percentage > 70
                      ? "Strong task completion rate"
                      : "Keep pushing on task completion"}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-900">⚡ Focus Areas</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {insights.metrics.sleep.avgHours < 7
                      ? "Improve sleep consistency"
                      : "Maintain sleep quality"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
