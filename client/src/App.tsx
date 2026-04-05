import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import TasksPage from "./pages/TasksPage";
import ProjectsPage from "./pages/ProjectsPage";
import HabitsPage from "./pages/HabitsPage";
import SleepPage from "./pages/SleepPage";
import GymDietPage from "./pages/GymDietPage";
import DailyReviewPage from "./pages/DailyReviewPage";
import AIThoughtPage from "./pages/AIThoughtPage";
import WeeklyInsightsPage from "./pages/WeeklyInsightsPage";
import DailyPlanPage from "./pages/DailyPlanPage";
import NotificationsPage from "./pages/NotificationsPage";
import DashboardPage from "./pages/DashboardPage";
import GoalsPage from "./pages/GoalsPage";
import FocusPage from "./pages/FocusPage";
import JournalPage from "./pages/JournalPage";
import SettingsPage from "./pages/SettingsPage";

function Router() {
  return (
    <Switch>
        <Route path={"/"} component={DashboardPage} />
        <Route path={"/tasks"} component={TasksPage} />
        <Route path={"/projects"} component={ProjectsPage} />
        <Route path={"/habits"} component={HabitsPage} />
        <Route path={"/sleep"} component={SleepPage} />
        <Route path={"/gym-diet"} component={GymDietPage} />
        <Route path={"/daily-review"} component={DailyReviewPage} />
        <Route path={"/ai-thought"} component={AIThoughtPage} />
        <Route path={"/weekly-insights"} component={WeeklyInsightsPage} />
        <Route path={"/daily-plan"} component={DailyPlanPage} />
        <Route path={"/notifications"} component={NotificationsPage} />
        <Route path={"/goals"} component={GoalsPage} />
        <Route path={"/focus"} component={FocusPage} />
        <Route path={"/journal"} component={JournalPage} />
        <Route path={"/settings"} component={SettingsPage} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
