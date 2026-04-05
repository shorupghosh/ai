import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2, Trash2, CheckCircle2, Circle, ChevronDown, ChevronRight, Zap, Wand2, Calendar, Check } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const PriorityBadge = ({ priority }: { priority: string }) => {
  if (priority === "high") {
    return <span className="bg-red-500/20 text-red-500 border border-red-500/30 font-medium px-2 py-0.5 rounded text-[11px]">High</span>;
  }
  if (priority === "medium") {
    return <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-medium px-2 py-0.5 rounded text-[11px]">Medium</span>;
  }
  return <span className="bg-green-500/20 text-green-500 border border-green-500/30 font-medium px-2 py-0.5 rounded text-[11px]">Low</span>;
};

export default function TasksPage() {
  const [, setLocation] = useLocation();
  const { data: tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = trpc.tasks.list.useQuery();
  const { data: projects, isLoading: isLoadingProjects, refetch: refetchProjects } = trpc.projects.list.useQuery();
  
  const createMutation = trpc.tasks.create.useMutation();
  const completeMutation = trpc.tasks.complete.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();
  const createProjectMutation = trpc.projects.create.useMutation();
  const processThoughtMutation = trpc.ai.processThought.useMutation();
  
  const [title, setTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [newProjectName, setNewProjectName] = useState("");
  const [dailyPlanText, setDailyPlanText] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inlineInput, setInlineInput] = useState<Record<string, string>>({});
  
  // By default, open 'none' (General tasks)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    "none": true
  });

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImportPlan = async () => {
    if (!dailyPlanText.trim()) {
      toast.error("Please enter your daily plan");
      return;
    }
    
    try {
      const res = await processThoughtMutation.mutateAsync({ thought: dailyPlanText });
      refetchTasks();
      toast.success(`Successfully extracted and created ${res.tasksCreated} tasks!`);
      setDailyPlanText("");
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to parse daily plan");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    let finalProjectId: number | undefined = undefined;

    try {
      if (selectedProjectId === "new") {
        if (!newProjectName.trim()) {
          toast.error("New project/goal name is required");
          return;
        }
        const projRes = await createProjectMutation.mutateAsync({ name: newProjectName.trim(), stage: "idea" });
        finalProjectId = projRes.id;
        setSelectedProjectId(finalProjectId!.toString());
        setNewProjectName("");
        refetchProjects();
        setExpandedProjects(prev => ({ ...prev, [finalProjectId!.toString()]: true }));
      } else if (selectedProjectId !== "none") {
        finalProjectId = parseInt(selectedProjectId);
      }

      await createMutation.mutateAsync({ title: title.trim(), projectId: finalProjectId });
      setTitle("");
      refetchTasks();
      toast.success("Task created");
      setIsCreateOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    }
  };

  const handleInlineCreate = async (pIdStr: string) => {
    const text = inlineInput[pIdStr];
    if (!text || !text.trim()) return;

    try {
      const pId = pIdStr === "none" ? undefined : parseInt(pIdStr);
      await createMutation.mutateAsync({ title: text.trim(), projectId: pId });
      setInlineInput(prev => ({ ...prev, [pIdStr]: "" }));
      refetchTasks();
      toast.success("Task created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id });
      refetchTasks();
      toast.success("Task completed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete task");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetchTasks();
      toast.success("Task deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task");
    }
  };

  if (isLoadingTasks || isLoadingProjects) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const safeTasks = tasks || [];
  const safeProjects = projects || [];

  const pendingTasks = safeTasks.filter(t => !t.isCompleted);
  const completedTasks = safeTasks.filter(t => t.isCompleted);

  // Group pending tasks by project
  const groupedTasks: Record<string, typeof safeTasks> = {
    "none": []
  };
  
  safeProjects.forEach(p => {
    groupedTasks[p.id.toString()] = [];
  });

  pendingTasks.forEach(task => {
    const pIdStr = task.projectId ? task.projectId.toString() : "none";
    if (groupedTasks[pIdStr]) {
      groupedTasks[pIdStr].push(task);
    } else {
      groupedTasks["none"].push(task);
    }
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">Manage your tasks and project goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/daily-plan")} className="gap-2 hidden md:flex">
            <Calendar className="w-4 h-4" />
            Go to Plan
          </Button>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Wand2 className="w-4 h-4" />
                Import Daily Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Import Daily Plan</DialogTitle>
                <DialogDescription>
                  Paste your daily plan or thoughts here. AI will automatically extract and create tasks for you.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea 
                  placeholder="E.g. Today I need to finish the marketing copy, then call John about the Gym Growth app, and finally do a 30min workout."
                  className="min-h-[120px]"
                  value={dailyPlanText}
                  onChange={(e) => setDailyPlanText(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleImportPlan} disabled={processThoughtMutation.isPending}>
                  {processThoughtMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Extract Tasks
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="mb-4 text-sm font-medium border">
            + Add Advanced Task
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a task to a specific project or goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General (No Project)</SelectItem>
                {safeProjects.map(proj => (
                  <SelectItem key={proj.id} value={proj.id.toString()}>
                    {proj.name}
                  </SelectItem>
                ))}
                <SelectItem value="new" className="text-blue-600 font-medium">
                  + Create New Project
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedProjectId === "new" && (
              <Input
                placeholder="Enter new project / goal name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createMutation.isPending || createProjectMutation.isPending} className="w-full sm:w-auto">
              {(createMutation.isPending || createProjectMutation.isPending) ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
              Create It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border border-border/40 rounded-lg overflow-x-auto bg-card shadow-sm mt-2">
        <div className="min-w-[700px]">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_150px_120px_100px_40px] gap-4 px-4 py-3 border-b border-border/40 text-muted-foreground text-xs font-semibold items-center">
            <div className="pl-8">Name</div>
            <div>Assignee</div>
            <div>Due date</div>
            <div>Priority</div>
            <div className="text-center">+</div>
          </div>

          {/* Project Groups */}
          <div className="flex flex-col">
            {Object.entries(groupedTasks).map(([pIdStr, groupTasks]) => {
              if (groupTasks.length === 0 && pIdStr !== "none") return null; 
              if (groupTasks.length === 0 && pIdStr === "none" && pendingTasks.length > 0) return null; 

              const projName = pIdStr === "none" ? "General Tasks" : safeProjects.find(p => p.id.toString() === pIdStr)?.name || "Unknown Project";
              const isExpanded = expandedProjects[pIdStr] ?? true; 
              
              return (
                <div key={pIdStr} className="flex flex-col">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleProject(pIdStr)}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/30 transition-colors border-b border-border/20 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <h2 className="text-sm font-semibold tracking-wide text-foreground/90">{projName}</h2>
                  </button>
                  
                  {/* Group Items */}
                  {isExpanded && (
                    <div className="flex flex-col">
                      {groupTasks.map((task) => (
                        <div key={task.id} className="grid grid-cols-[1fr_150px_120px_100px_40px] gap-4 px-4 py-2 border-b border-border/20 hover:bg-muted/20 items-center group/row transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <button
                              onClick={() => handleComplete(task.id)}
                              className="flex-shrink-0 text-muted-foreground/60 hover:text-green-500 transition-colors"
                            >
                              <Circle className="w-4 h-4 ml-2" />
                            </button>
                            <span className="text-sm font-medium truncate">{task.title}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#fca5a5]/20 text-[#f87171] font-bold flex items-center justify-center text-[9px] uppercase">
                              SG
                            </div>
                            <span className="text-xs truncate text-muted-foreground">shorup ghosh</span>
                          </div>

                          <div className="text-xs text-muted-foreground truncate">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : <span className="opacity-0 group-hover/row:opacity-100 placeholder-text cursor-pointer">Set date</span>}
                          </div>

                          <div>
                            <PriorityBadge priority={task.priority} />
                          </div>

                          <div className="flex items-center justify-center">
                            <Trash2 
                              className="w-4 h-4 text-muted-foreground opacity-0 group-hover/row:opacity-100 hover:text-red-500 cursor-pointer transition-all" 
                              onClick={() => handleDelete(task.id)} 
                            />
                          </div>
                        </div>
                      ))}
                      
                      {/* Inline Add Task Row */}
                      <div className="grid grid-cols-[1fr_150px_120px_100px_40px] gap-4 px-4 border-b border-border/20 items-center bg-transparent group/add">
                        <div className="flex items-center gap-3 pl-8 overflow-hidden py-1">
                          <Input 
                            placeholder="Add task..." 
                            className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm text-foreground placeholder:text-muted-foreground/70 rounded-none w-full"
                            value={inlineInput[pIdStr] || ""}
                            onChange={(e) => setInlineInput(prev => ({ ...prev, [pIdStr]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleInlineCreate(pIdStr)}
                          />
                        </div>
                        <div className="opacity-0 group-focus-within/add:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleInlineCreate(pIdStr)}>Add</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completed Group */}
          {completedTasks.length > 0 && (
            <div className="flex flex-col opacity-60">
              <button
                onClick={() => toggleProject("completed")}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/30 transition-colors border-b border-border/20 text-left"
              >
                {expandedProjects["completed"] ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <h2 className="text-sm font-semibold tracking-wide">Completed Logs</h2>
              </button>
              
              {expandedProjects["completed"] && (
                <div className="flex flex-col">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="grid grid-cols-[1fr_150px_120px_100px_40px] gap-4 px-4 py-2 border-b border-border/20 hover:bg-muted/20 items-center group/row transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden text-muted-foreground/70">
                        <CheckCircle2 className="w-4 h-4 ml-2 text-green-600 flex-shrink-0" />
                        <span className="text-sm line-through truncate">{task.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-50">
                        <div className="w-5 h-5 rounded-full bg-[#fca5a5]/20 text-[#f87171] font-bold flex items-center justify-center text-[9px] uppercase">
                          SG
                        </div>
                        <span className="text-xs truncate text-muted-foreground">shorup ghosh</span>
                      </div>

                      <div className="text-xs text-muted-foreground truncate opacity-50">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </div>

                      <div className="opacity-50">
                        <PriorityBadge priority={task.priority} />
                      </div>

                      <div className="flex items-center justify-center">
                        <Trash2 
                          className="w-4 h-4 text-muted-foreground opacity-0 group-hover/row:opacity-100 hover:text-red-500 cursor-pointer transition-all" 
                          onClick={() => handleDelete(task.id)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
