import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bell, CheckCircle2, Zap, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { data: notifications, refetch } = trpc.notifications.list.useQuery();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const [filter, setFilter] = useState<"all" | "unread" | "habit_trigger">("all");

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      toast.success("Notification marked as read");
      refetch();
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const filteredNotifications = notifications?.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "habit_trigger") return n.type === "habit_trigger";
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "habit_trigger":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "task_reminder":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "daily_plan":
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case "achievement":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "habit_trigger":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "task_reminder":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "daily_plan":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "achievement":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-600" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {notifications?.length || 0} total • {notifications?.filter((n) => !n.isRead).length || 0} unread
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="transition-smooth"
        >
          All Notifications
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
          className="transition-smooth"
        >
          Unread
        </Button>
        <Button
          variant={filter === "habit_trigger" ? "default" : "outline"}
          onClick={() => setFilter("habit_trigger")}
          className="transition-smooth flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Habit Triggers
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${getNotificationColor(notification.type)} border-2 transition-smooth cursor-pointer hover:shadow-lg ${
                !notification.isRead ? "ring-2 ring-offset-2 ring-blue-400" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                    {notification.copingStrategy && (
                      <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-dashed">
                        <p className="text-sm font-medium">💡 Coping Strategy:</p>
                        <p className="text-sm mt-1">{notification.copingStrategy}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="transition-smooth"
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-gradient">
            <CardContent className="pt-12 pb-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground text-lg">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your habit triggers and reminders will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-gradient card-hover">
          <CardHeader>
            <CardTitle className="text-sm">Habit Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {notifications?.filter((n) => n.type === "habit_trigger").length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="card-gradient card-hover">
          <CardHeader>
            <CardTitle className="text-sm">Task Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {notifications?.filter((n) => n.type === "task_reminder").length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="card-gradient card-hover">
          <CardHeader>
            <CardTitle className="text-sm">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {notifications?.filter((n) => n.type === "achievement").length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
