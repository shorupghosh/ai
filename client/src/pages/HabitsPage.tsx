import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function HabitsPage() {
  const { data: habits, isLoading, refetch } = trpc.habits.list.useQuery();
  const logMutation = trpc.habits.log.useMutation();
  const deleteMutation = trpc.habits.delete.useMutation();
  
  const [habitType, setHabitType] = useState<"cigarettes" | "joints" | "stimulant_use">("cigarettes");
  const [count, setCount] = useState("1");
  const [urgeLevel, setUrgeLevel] = useState("5");
  const [triggerNotes, setTriggerNotes] = useState("");

  const handleLog = async () => {
    try {
      await logMutation.mutateAsync({
        habitType,
        count: parseInt(count) || 1,
        urgeLevel: parseInt(urgeLevel),
        triggerNotes: triggerNotes.trim() || undefined,
        date: new Date(),
      });
      setCount("1");
      setUrgeLevel("5");
      setTriggerNotes("");
      refetch();
      toast.success("Habit logged");
    } catch (error) {
      toast.error("Failed to log habit");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Habit entry deleted");
    } catch (error) {
      toast.error("Failed to delete habit");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const habitLabels: Record<string, string> = {
    cigarettes: "🚬 Cigarettes",
    joints: "🚬 Joints",
    stimulant_use: "⚡ Stimulant Use",
  };

  const habitCounts = {
    cigarettes: habits?.filter(h => h.habitType === "cigarettes").length || 0,
    joints: habits?.filter(h => h.habitType === "joints").length || 0,
    stimulant_use: habits?.filter(h => h.habitType === "stimulant_use").length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Habit Tracker</h1>
        <p className="text-muted-foreground">Track your habits and urges</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cigarettes Logged</p>
            <p className="text-2xl font-bold">{habitCounts.cigarettes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Joints Logged</p>
            <p className="text-2xl font-bold">{habitCounts.joints}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Stimulants Logged</p>
            <p className="text-2xl font-bold">{habitCounts.stimulant_use}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Habit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={habitType}
            onChange={(e) => setHabitType(e.target.value as any)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="cigarettes">Cigarettes</option>
            <option value="joints">Joints</option>
            <option value="stimulant_use">Stimulant Use</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Count</label>
              <Input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Urge Level (1-10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={urgeLevel}
                onChange={(e) => setUrgeLevel(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Trigger Notes</label>
            <Input
              placeholder="What triggered this?"
              value={triggerNotes}
              onChange={(e) => setTriggerNotes(e.target.value)}
            />
          </div>

          <Button onClick={handleLog} disabled={logMutation.isPending} className="w-full">
            {logMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Log Habit
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Recent Logs ({habits?.length || 0})</h2>
        {habits && habits.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No habits logged yet</p>
            </CardContent>
          </Card>
        ) : (
          habits?.map((habit) => (
            <Card key={habit.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{habitLabels[habit.habitType]}</p>
                  <p className="text-sm text-muted-foreground">
                    Count: {habit.count} | Urge: {habit.urgeLevel}/10
                  </p>
                  {habit.triggerNotes && (
                    <p className="text-sm mt-1 text-gray-600">Trigger: {habit.triggerNotes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
