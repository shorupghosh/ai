import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

export default function TasksPage() {
  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery();
  const createMutation = trpc.tasks.create.useMutation();
  const completeMutation = trpc.tasks.complete.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();
  
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      await createMutation.mutateAsync({ title: title.trim() });
      setTitle("");
      refetch();
      toast.success("Task created");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id });
      refetch();
      toast.success("Task completed");
    } catch (error) {
      toast.error("Failed to complete task");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Manage your tasks and stay organized</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Create Task
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-3">Pending Tasks ({pendingTasks.length})</h2>
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">No pending tasks. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="flex-shrink-0 hover:text-green-600 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                        <div className="flex gap-2 mt-1">
                          {task.priority && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.priority === "high" ? "bg-red-100 text-red-700" :
                              task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Completed ({completedTasks.length})</h2>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <Card key={task.id} className="opacity-75">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium line-through">{task.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
