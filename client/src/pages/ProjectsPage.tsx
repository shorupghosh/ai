import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();
  
  const [name, setName] = useState("");
  const [stage, setStage] = useState<"idea" | "build" | "test" | "launch" | "growth">("idea");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await createMutation.mutateAsync({ name: name.trim(), stage });
      setName("");
      refetch();
      toast.success("Project created");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const stageColors: Record<string, string> = {
    idea: "bg-gray-100 text-gray-700",
    build: "bg-blue-100 text-blue-700",
    test: "bg-yellow-100 text-yellow-700",
    launch: "bg-green-100 text-green-700",
    growth: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">Track your projects from idea to growth</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Project name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as any)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="idea">Idea</option>
            <option value="build">Build</option>
            <option value="test">Test</option>
            <option value="launch">Launch</option>
            <option value="growth">Growth</option>
          </select>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Create Project
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {projects && projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No projects yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          projects?.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${stageColors[project.stage]}`}>
                      {project.stage}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>

                {project.nextAction && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <p className="font-medium text-blue-900">Next Action:</p>
                    <p className="text-blue-800">{project.nextAction}</p>
                  </div>
                )}

                {project.blocker && (
                  <div className="bg-red-50 p-2 rounded text-sm">
                    <p className="font-medium text-red-900">Blocker:</p>
                    <p className="text-red-800">{project.blocker}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
