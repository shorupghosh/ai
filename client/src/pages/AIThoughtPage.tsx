import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AIThoughtPage() {
  const { refetch: refetchTasks } = trpc.tasks.list.useQuery();
  const processMutation = trpc.ai.processThought.useMutation();
  
  const [thought, setThought] = useState("");
  const [processedTasks, setProcessedTasks] = useState<Array<{ title: string; priority: string }> | null>(null);

  const handleProcessThought = async () => {
    if (!thought.trim()) {
      toast.error("Please enter a thought");
      return;
    }

    try {
      const result = await processMutation.mutateAsync({ thought: thought.trim() });
      setProcessedTasks(result.tasks);
      setThought("");
      refetchTasks();
      toast.success(`Created ${result.tasksCreated} task(s) from your thought!`);
    } catch (error) {
      toast.error("Failed to process thought. Try again.");
      console.error(error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          AI Thought Processor
        </h1>
        <p className="text-muted-foreground">Convert your raw thoughts into structured tasks using AI</p>
      </div>

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle>Capture Your Thought</CardTitle>
          <CardDescription>Write anything on your mind - the AI will extract actionable tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g., 'Need to finish the gym SaaS landing page, fix the pricing section, and reach out to 10 potential customers this week'"
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            className="min-h-32"
          />
          <Button
            onClick={handleProcessThought}
            disabled={processMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {processMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 w-4 h-4" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 w-4 h-4" />
                Process with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {processedTasks && processedTasks.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Tasks Created ({processedTasks.length})
            </CardTitle>
            <CardDescription>These tasks have been added to your task list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedTasks.map((task, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <p className="font-medium">{task.title}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Write Your Thought</p>
              <p className="text-muted-foreground">Share any idea, plan, or task in natural language</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <p className="font-medium">AI Processing</p>
              <p className="text-muted-foreground">The AI extracts structured tasks with priorities and dates</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <p className="font-medium">Auto-Create Tasks</p>
              <p className="text-muted-foreground">Tasks are instantly added to your task list and ready to work on</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✓ Be specific about deadlines (e.g., "by Friday", "next week")</p>
          <p>✓ Mention priorities (e.g., "urgent", "low priority")</p>
          <p>✓ Include project names if you have existing projects</p>
          <p>✓ Write naturally - the AI understands context and nuance</p>
        </CardContent>
      </Card>
    </div>
  );
}
