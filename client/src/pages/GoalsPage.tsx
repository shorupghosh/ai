import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Loader2, Target, Plus, Trash2, Trophy, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  health: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  professional: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  personal: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  finance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

const CATEGORY_ICONS: Record<string, string> = {
  health: "💚", professional: "💼", personal: "⭐", finance: "💰",
};

function ProgressRing({ progress, size = 80, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#gradient)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-foreground font-bold text-sm" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {progress.toFixed(0)}%
      </text>
    </svg>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading, refetch } = trpc.goals.list.useQuery();
  const createMutation = trpc.goals.create.useMutation();
  const updateMutation = trpc.goals.update.useMutation();
  const deleteMutation = trpc.goals.delete.useMutation();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("personal");
  const [targetDate, setTargetDate] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Goal title is required"); return; }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category as any,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      });
      setTitle(""); setDescription(""); setTargetDate("");
      setShowForm(false);
      refetch();
      toast.success("🎯 Goal created!");
    } catch { toast.error("Failed to create goal"); }
  };

  const handleProgressUpdate = async (id: number, newProgress: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        progressPercent: newProgress,
        status: newProgress >= 100 ? "completed" : "active",
      });
      refetch();
      if (newProgress >= 100) toast.success("🏆 Goal completed! Amazing!");
    } catch { toast.error("Failed to update progress"); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
      </div>
    );
  }

  const activeGoals = goals?.filter(g => g.status === "active") || [];
  const completedGoals = goals?.filter(g => g.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Target className="w-6 h-6" />
            </div>
            Goals
          </h1>
          <p className="text-muted-foreground mt-1">Set, track, and crush your goals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader><CardTitle className="text-lg">Create New Goal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="What do you want to achieve?" value={title} onChange={e => setTitle(e.target.value)} className="text-lg" />
                <Textarea placeholder="Why is this important to you?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                <div className="flex gap-3 flex-wrap">
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${category === cat ? CATEGORY_COLORS[cat] + " ring-2 ring-offset-2 ring-purple-500" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">Target Date</label>
                    <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                  </div>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Create Goal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Goals */}
      {activeGoals.length === 0 && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No active goals yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">Set a goal to start tracking your progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGoals.map((goal, i) => (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-l-4" style={{ borderLeftColor: category === "health" ? "#10b981" : "#8b5cf6" }}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <ProgressRing progress={goal.progressPercent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.personal}>
                          {CATEGORY_ICONS[goal.category]} {goal.category}
                        </Badge>
                        {goal.targetDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg leading-tight">{goal.title}</h3>
                      {goal.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>}
                      <div className="mt-3 flex items-center gap-2">
                        <input type="range" min="0" max="100" value={goal.progressPercent} onChange={e => handleProgressUpdate(goal.id, parseInt(e.target.value))} className="flex-1 accent-purple-600 h-2" />
                        <button onClick={() => deleteMutation.mutateAsync({ id: goal.id }).then(() => { refetch(); toast.success("Goal deleted"); })} className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Completed ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedGoals.map(goal => (
              <Card key={goal.id} className="opacity-80 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardContent className="pt-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">{goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : "Completed"}</p>
                  </div>
                  <Badge className={CATEGORY_COLORS[goal.category]}>{CATEGORY_ICONS[goal.category]}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
