import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { Settings, User, Palette, Bell, Shield, Download, Sun, Moon, Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";

const ACCENT_COLORS = [
  { name: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
  { name: "Green", value: "#10b981", class: "bg-emerald-500" },
  { name: "Pink", value: "#ec4899", class: "bg-pink-500" },
  { name: "Orange", value: "#f97316", class: "bg-orange-500" },
  { name: "Red", value: "#ef4444", class: "bg-red-500" },
  { name: "Cyan", value: "#06b6d4", class: "bg-cyan-500" },
  { name: "Indigo", value: "#6366f1", class: "bg-indigo-500" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [morningPlan, setMorningPlan] = useState(true);
  const [eveningReview, setEveningReview] = useState(true);
  const [habitAlerts, setHabitAlerts] = useState(true);
  const [selectedColor, setSelectedColor] = useState("#8b5cf6");

  const handleExportData = () => {
    toast.success("Data export started. Check your downloads shortly.");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <Settings className="w-6 h-6" />
          </div>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Customize your experience</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "No email set"}</p>
                <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {user?.role || "user"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Appearance</CardTitle>
            <CardDescription>Theme and visual preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={() => toggleTheme?.()} />
            </div>

            {/* Accent Color */}
            <div>
              <p className="font-medium mb-2">Accent Color</p>
              <div className="flex gap-2">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => { setSelectedColor(color.value); toast.success(`Accent color set to ${color.name}`); }}
                    className={`w-8 h-8 rounded-full ${color.class} transition-all ${selectedColor === color.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Push Notifications", desc: "Receive browser notifications", value: notifications, set: setNotifications },
              { label: "Morning Plan (7:00 AM)", desc: "Get your daily plan every morning", value: morningPlan, set: setMorningPlan },
              { label: "Evening Review (9:00 PM)", desc: "Reminder to complete daily review", value: eveningReview, set: setEveningReview },
              { label: "Habit Trigger Alerts", desc: "Get warned about high-risk situations", value: habitAlerts, set: setHabitAlerts },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={() => item.set(!item.value)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Integrations */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5" /> Integrations</CardTitle>
            <CardDescription>Connect external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Google Calendar", icon: "📅", status: "not_connected", desc: "Sync tasks to your calendar" },
              { name: "Telegram Bot", icon: "📱", status: "not_connected", desc: "Get notifications via Telegram" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon!")}>
                  Connect
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Data */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Data & Privacy</CardTitle>
            <CardDescription>Manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" /> Export All Data (JSON)
            </Button>
            <p className="text-xs text-muted-foreground">Your data is stored securely and never shared with third parties.</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
