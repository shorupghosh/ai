import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Loader2, Clock, Zap, Target, AlertCircle } from "lucide-react";
import { Streamdown } from "streamdown";

export default function DailyPlanPage() {
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const { data: plan, isLoading, refetch } = trpc.ai.generateDailyPlan.useQuery({ energyLevel });

  const handleGeneratePlan = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Generating your daily plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-blue-600" />
            Daily Plan
          </h1>
          <p className="text-muted-foreground">No plan generated yet</p>
        </div>
      </div>
    );
  }

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getEnergyColor = (level: number) => {
    if (level >= 8) return 'text-green-600';
    if (level >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-blue-600" />
            Today's Plan
          </h1>
          <p className="text-muted-foreground">
            {plan.taskCount} tasks to complete • Energy level: {plan.energyLevel.toFixed(1)}/10
          </p>
        </div>
        <Button onClick={handleGeneratePlan} className="gap-2">
          <Zap className="w-4 h-4" />
          Regenerate Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Daily Schedule
              </CardTitle>
              <CardDescription>Optimized task order and timing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.plan.tasks && plan.plan.tasks.length > 0 ? (
                plan.plan.tasks.map((task: any, idx: number) => {
                  const startMinutes = timeToMinutes(task.startTime);
                  const endMinutes = startMinutes + (task.duration || 60);
                  const endTime = minutesToTime(endMinutes);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${getPriorityColor(task.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>
                              {task.startTime} - {endTime} ({task.duration} min)
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-white/50">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground">No tasks scheduled</p>
              )}

              {plan.plan.breaks && plan.plan.breaks.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Break Times</h4>
                  <div className="space-y-2">
                    {plan.plan.breaks.map((breakItem: any, idx: number) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {breakItem.time} - {minutesToTime(timeToMinutes(breakItem.time) + breakItem.duration)}
                          </span>
                          <span className="text-sm text-muted-foreground">({breakItem.duration} min)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Energy Level Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Energy Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current: {energyLevel}/10</span>
                  <span className={`text-lg font-bold ${getEnergyColor(energyLevel)}`}>
                    {energyLevel >= 8 ? '⚡' : energyLevel >= 5 ? '🔋' : '😴'}
                  </span>
                </div>
                <Slider
                  value={[energyLevel]}
                  onValueChange={(value) => setEnergyLevel(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
              <Button onClick={handleGeneratePlan} className="w-full">
                Update Plan
              </Button>
            </CardContent>
          </Card>

          {/* Strategies */}
          {plan.plan.strategies && plan.plan.strategies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Focus Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.plan.strategies.map((strategy: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{strategy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {plan.plan.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{plan.plan.summary}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
