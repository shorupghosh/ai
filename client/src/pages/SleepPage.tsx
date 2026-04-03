import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SleepPage() {
  const { data: sleepData, isLoading, refetch } = trpc.sleep.list.useQuery();
  const logMutation = trpc.sleep.log.useMutation();
  const deleteMutation = trpc.sleep.delete.useMutation();
  
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState("7");

  const handleLog = async () => {
    try {
      const today = new Date();
      const sleep = new Date(today);
      const [sh, sm] = sleepTime.split(":").map(Number);
      sleep.setHours(sh, sm, 0);

      const wake = new Date(today);
      const [wh, wm] = wakeTime.split(":").map(Number);
      wake.setHours(wh, wm, 0);

      if (wake <= sleep) wake.setDate(wake.getDate() + 1);

      await logMutation.mutateAsync({
        sleepTime: sleep,
        wakeTime: wake,
        quality: parseInt(quality),
        date: today,
      });
      setQuality("7");
      refetch();
      toast.success("Sleep logged");
    } catch (error) {
      toast.error("Failed to log sleep");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Sleep entry deleted");
    } catch (error) {
      toast.error("Failed to delete sleep");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const avgSleep = sleepData && sleepData.length > 0
    ? (sleepData.reduce((sum, s) => sum + parseFloat(s.totalHours as any), 0) / sleepData.length).toFixed(1)
    : "0";

  const avgQuality = sleepData && sleepData.length > 0
    ? (sleepData.reduce((sum, s) => sum + (s.quality || 0), 0) / sleepData.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sleep Tracker</h1>
        <p className="text-muted-foreground">Monitor your sleep patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Logs</p>
            <p className="text-2xl font-bold">{sleepData?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Sleep Hours</p>
            <p className="text-2xl font-bold">{avgSleep}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Quality</p>
            <p className="text-2xl font-bold">{avgQuality}/10</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Sleep</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Sleep Time</label>
              <Input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Wake Time</label>
              <Input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Sleep Quality (1-10)</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            />
          </div>

          <Button onClick={handleLog} disabled={logMutation.isPending} className="w-full">
            {logMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Log Sleep
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Sleep History</h2>
        {sleepData && sleepData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No sleep logs yet</p>
            </CardContent>
          </Card>
        ) : (
          sleepData?.map((sleep) => (
            <Card key={sleep.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">
                    {new Date(sleep.sleepTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(sleep.wakeTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {sleep.totalHours}h | Quality: {sleep.quality}/10
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(sleep.id)}
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
