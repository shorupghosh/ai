import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GymDietPage() {
  const { data: gymData, isLoading, refetch } = trpc.gymDiet.list.useQuery();
  const logMutation = trpc.gymDiet.log.useMutation();
  const deleteMutation = trpc.gymDiet.delete.useMutation();
  
  const [workoutDone, setWorkoutDone] = useState(false);
  const [weight, setWeight] = useState("");
  const [meals, setMeals] = useState("");
  const [proteinIntake, setProteinIntake] = useState("");
  const [waterIntake, setWaterIntake] = useState("");

  const handleLog = async () => {
    try {
      await logMutation.mutateAsync({
        workoutDone,
        weight: weight ? parseFloat(weight) : undefined,
        meals: meals || undefined,
        proteinIntake: proteinIntake ? parseInt(proteinIntake) : undefined,
        waterIntake: waterIntake ? parseInt(waterIntake) : undefined,
        date: new Date(),
      });
      setWorkoutDone(false);
      setWeight("");
      setMeals("");
      setProteinIntake("");
      setWaterIntake("");
      refetch();
      toast.success("Gym/Diet logged");
    } catch (error) {
      toast.error("Failed to log gym/diet");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Entry deleted");
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const workoutsCompleted = gymData?.filter(g => g.workoutDone).length || 0;
  const avgProtein = gymData && gymData.length > 0
    ? (gymData.reduce((sum, g) => sum + (g.proteinIntake || 0), 0) / gymData.length).toFixed(0)
    : "0";
  const avgWater = gymData && gymData.length > 0
    ? (gymData.reduce((sum, g) => sum + (g.waterIntake || 0), 0) / gymData.length).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gym & Diet</h1>
        <p className="text-muted-foreground">Track your fitness and nutrition</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Logs</p>
            <p className="text-2xl font-bold">{gymData?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Workouts Done</p>
            <p className="text-2xl font-bold">{workoutsCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Protein (g)</p>
            <p className="text-2xl font-bold">{avgProtein}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Water (ml)</p>
            <p className="text-2xl font-bold">{avgWater}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Gym & Diet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={workoutDone}
              onCheckedChange={(checked) => setWorkoutDone(checked as boolean)}
            />
            <label className="text-sm font-medium">Workout Completed</label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 75.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Protein Intake (g)</label>
              <Input
                type="number"
                placeholder="e.g., 150"
                value={proteinIntake}
                onChange={(e) => setProteinIntake(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Water Intake (ml)</label>
            <Input
              type="number"
              placeholder="e.g., 2000"
              value={waterIntake}
              onChange={(e) => setWaterIntake(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Meals</label>
            <Input
              placeholder="Describe your meals today..."
              value={meals}
              onChange={(e) => setMeals(e.target.value)}
            />
          </div>

          <Button onClick={handleLog} disabled={logMutation.isPending} className="w-full">
            {logMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Log Entry
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">History</h2>
        {gymData && gymData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No entries yet</p>
            </CardContent>
          </Card>
        ) : (
          gymData?.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {entry.workoutDone && <span className="text-sm font-medium text-green-600">✓ Workout Done</span>}
                    {!entry.workoutDone && <span className="text-sm text-muted-foreground">No workout</span>}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {entry.weight && <p>Weight: {entry.weight}kg</p>}
                  {entry.proteinIntake && <p>Protein: {entry.proteinIntake}g</p>}
                  {entry.waterIntake && <p>Water: {entry.waterIntake}ml</p>}
                </div>
                {entry.meals && <p className="text-sm text-muted-foreground">Meals: {entry.meals}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
