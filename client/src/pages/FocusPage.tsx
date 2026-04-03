import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer, Play, Pause, RotateCcw, CheckCircle2, Zap, Brain, Coffee, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PRESETS = [
  { label: "Pomodoro", work: 25, break: 5, icon: "🍅" },
  { label: "Deep Work", work: 50, break: 10, icon: "🧠" },
  { label: "Focused Sprint", work: 15, break: 3, icon: "⚡" },
  { label: "Marathon", work: 90, break: 15, icon: "🏃" },
];

const AMBIENT_SOUNDS = ["None", "Rain", "White Noise", "Forest", "Ocean"];

export default function FocusPage() {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [breakDuration, setBreakDuration] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [ambientSound, setAmbientSound] = useState("None");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: stats } = trpc.focus.stats.useQuery();
  const { data: tasksList } = trpc.tasks.list.useQuery();
  const startMutation = trpc.focus.start.useMutation();
  const completeMutation = trpc.focus.complete.useMutation();

  const pendingTasks = tasksList?.filter(t => t.status === "pending") || [];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = isBreak
    ? ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100
    : ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  const startTimer = useCallback(async () => {
    setIsRunning(true);
    if (!isBreak) {
      try { await startMutation.mutateAsync({ duration, type: duration <= 25 ? "pomodoro" : "deep_work" }); } catch {}
    }
  }, [duration, isBreak, startMutation]);

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(duration * 60);
    setDistractions(0);
  };

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    if (!isBreak) {
      setSessionsCompleted(prev => prev + 1);
      try { await completeMutation.mutateAsync({ id: 0, distractionCount: distractions }); } catch {}
      toast.success("🎉 Focus session complete! Take a break.");
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
    } else {
      toast.success("Break's over! Ready for another round?");
      setIsBreak(false);
      setTimeLeft(duration * 60);
      setDistractions(0);
    }
  }, [isBreak, duration, breakDuration, distractions, completeMutation]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, handleComplete]);

  const applyPreset = (index: number) => {
    setSelectedPreset(index);
    const p = PRESETS[index];
    setDuration(p.work);
    setBreakDuration(p.break);
    setTimeLeft(p.work * 60);
    setIsRunning(false);
    setIsBreak(false);
    setDistractions(0);
  };

  // Circle timer SVG
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <Timer className="w-6 h-6" />
          </div>
          Focus Timer
        </h1>
        <p className="text-muted-foreground mt-1">Deep work sessions with the Pomodoro technique</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's Sessions", value: sessionsCompleted, icon: Zap, color: "text-yellow-500" },
          { label: "Total Sessions", value: stats?.totalSessions || 0, icon: CheckCircle2, color: "text-green-500" },
          { label: "Total Focus", value: `${Math.round((stats?.totalMinutes || 0) / 60)}h`, icon: Brain, color: "text-purple-500" },
          { label: "Avg Duration", value: `${stats?.avgDuration || 0}m`, icon: Timer, color: "text-blue-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-gradient-to-br from-card to-muted/30">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Card className={`overflow-hidden transition-all duration-500 ${isBreak ? "border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950" : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"}`}>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                {isBreak ? "☕ Break Time" : `${PRESETS[selectedPreset].icon} ${PRESETS[selectedPreset].label}`}
              </p>

              {/* Circular Timer */}
              <div className="relative mb-6">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-muted/20" />
                  <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-1000 ease-linear ${isBreak ? "stroke-green-500" : "stroke-orange-500"}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl md:text-6xl font-mono font-bold tracking-tight">{formatTime(timeLeft)}</span>
                  {distractions > 0 && (
                    <span className="text-xs text-muted-foreground mt-2">
                      {distractions} distraction{distractions > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={resetTimer} className="w-12 h-12 rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  onClick={isRunning ? pauseTimer : startTimer}
                  size="lg"
                  className={`w-20 h-20 rounded-full shadow-xl text-white ${isBreak ? "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" : "bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"}`}
                >
                  {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setDistractions(d => d + 1)} className="w-12 h-12 rounded-full" title="Log distraction">
                  <Zap className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Presets</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(i)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 ${selectedPreset === i ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 ring-1 ring-orange-300" : "hover:bg-muted"}`}
                >
                  <span className="text-xl">{preset.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">{preset.work}m work / {preset.break}m break</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Link Task */}
          {pendingTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Link to Task</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pendingTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="text-sm px-2 py-1.5 rounded hover:bg-muted cursor-pointer truncate">
                      {task.title}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
