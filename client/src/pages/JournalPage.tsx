import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Plus, Sparkles, Heart, Smile, Frown, Meh, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const MOOD_EMOJIS = [
  { value: 1, emoji: "😢", label: "Terrible" },
  { value: 2, emoji: "😟", label: "Bad" },
  { value: 3, emoji: "😕", label: "Meh" },
  { value: 4, emoji: "😐", label: "Okay" },
  { value: 5, emoji: "🙂", label: "Fine" },
  { value: 6, emoji: "😊", label: "Good" },
  { value: 7, emoji: "😄", label: "Great" },
  { value: 8, emoji: "🤩", label: "Amazing" },
  { value: 9, emoji: "🥳", label: "Fantastic" },
  { value: 10, emoji: "🌟", label: "Perfect" },
];

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  neutral: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  negative: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

export default function JournalPage() {
  const { data: entries, isLoading, refetch } = trpc.journal.list.useQuery();
  const { data: promptOfDay } = trpc.journal.getPrompt.useQuery();
  const createMutation = trpc.journal.create.useMutation();
  const deleteMutation = trpc.journal.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(5);
  const [isGratitude, setIsGratitude] = useState(false);

  const handleCreate = async () => {
    if (!content.trim()) { toast.error("Write something first!"); return; }
    try {
      const result = await createMutation.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim(),
        mood,
        isGratitude,
        date: new Date(),
      });
      setTitle(""); setContent(""); setShowForm(false);
      refetch();
      toast.success(`📝 Journal saved! Mood: ${result.sentiment || "analyzed"}`);
    } catch { toast.error("Failed to save entry"); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            Journal
          </h1>
          <p className="text-muted-foreground mt-1">Your private space for reflection and growth</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {/* Daily Prompt */}
      {promptOfDay && !showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 border-none shadow-lg">
            <CardContent className="pt-6 flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Today's Prompt</p>
                <p className="text-lg font-medium mt-1">{promptOfDay}</p>
                <Button variant="ghost" size="sm" className="mt-2 text-indigo-600" onClick={() => { setContent(promptOfDay + "\n\n"); setShowForm(true); }}>
                  Start writing →
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* New Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="shadow-xl border-indigo-200 dark:border-indigo-800">
              <CardContent className="pt-6 space-y-4">
                <Input placeholder="Entry title (optional)" value={title} onChange={e => setTitle(e.target.value)} className="text-lg border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 font-medium" />
                <Textarea
                  placeholder="What's on your mind? Write freely..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  className="resize-none border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 text-base leading-relaxed"
                />

                {/* Mood Slider */}
                <div>
                  <p className="text-sm font-medium mb-2">How are you feeling? {MOOD_EMOJIS[mood - 1]?.emoji}</p>
                  <div className="flex gap-1">
                    {MOOD_EMOJIS.map(m => (
                      <button key={m.value} onClick={() => setMood(m.value)} className={`text-xl p-1 rounded-lg transition-all ${mood === m.value ? "bg-indigo-100 dark:bg-indigo-900 scale-125" : "opacity-40 hover:opacity-70"}`} title={m.label}>
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gratitude Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsGratitude(!isGratitude)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${isGratitude ? "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300" : "bg-muted text-muted-foreground"}`}
                  >
                    <Heart className={`w-4 h-4 ${isGratitude ? "fill-current" : ""}`} />
                    Gratitude Entry
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                    {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Save & Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Entries */}
      {(!entries || entries.length === 0) && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Your journal is empty</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">Start writing to track your thoughts and emotions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries?.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {entry.mood && <span className="text-sm">{MOOD_EMOJIS[entry.mood - 1]?.emoji}</span>}
                        {entry.sentiment && <Badge className={SENTIMENT_COLORS[entry.sentiment]}>{entry.sentiment}</Badge>}
                        {entry.isGratitude && <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"><Heart className="w-3 h-3 mr-1 fill-current" /> Gratitude</Badge>}
                      </div>
                      {entry.title && <h3 className="font-bold text-base mb-1">{entry.title}</h3>}
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{entry.content}</p>
                      {entry.aiSummary && (
                        <div className="mt-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Summary
                          </p>
                          <p className="text-sm mt-0.5">{entry.aiSummary}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => deleteMutation.mutateAsync({ id: entry.id }).then(() => { refetch(); toast.success("Entry deleted"); })} className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
