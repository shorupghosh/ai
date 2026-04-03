import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DailyReviewPage() {
  const { data: reviews, isLoading, refetch } = trpc.dailyReview.list.useQuery();
  const createMutation = trpc.dailyReview.create.useMutation();
  const deleteMutation = trpc.dailyReview.delete.useMutation();
  
  const [wins, setWins] = useState("");
  const [misses, setMisses] = useState("");
  const [mood, setMood] = useState("7");
  const [energy, setEnergy] = useState("7");
  const [tomorrowFocus, setTomorrowFocus] = useState("");

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        wins: wins || undefined,
        misses: misses || undefined,
        mood: parseInt(mood),
        energy: parseInt(energy),
        tomorrowFocus: tomorrowFocus || undefined,
        date: new Date(),
      });
      setWins("");
      setMisses("");
      setMood("7");
      setEnergy("7");
      setTomorrowFocus("");
      refetch();
      toast.success("Daily review saved");
    } catch (error) {
      toast.error("Failed to save review");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Review deleted");
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const avgMood = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.mood || 0), 0) / reviews.length).toFixed(1)
    : "0";
  const avgEnergy = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.energy || 0), 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Review</h1>
        <p className="text-muted-foreground">Reflect on your day and plan tomorrow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Reviews</p>
            <p className="text-2xl font-bold">{reviews?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Mood</p>
            <p className="text-2xl font-bold">{avgMood}/10</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Energy</p>
            <p className="text-2xl font-bold">{avgEnergy}/10</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Wins (What went well?)</label>
            <Input
              placeholder="List your wins today..."
              value={wins}
              onChange={(e) => setWins(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Misses (What could be better?)</label>
            <Input
              placeholder="What didn't go as planned..."
              value={misses}
              onChange={(e) => setMisses(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Mood (1-10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Energy (1-10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tomorrow's Focus</label>
            <Input
              placeholder="What's your main focus for tomorrow?"
              value={tomorrowFocus}
              onChange={(e) => setTomorrowFocus(e.target.value)}
            />
          </div>

          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            Save Review
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Past Reviews</h2>
        {reviews && reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No reviews yet. Start with today!</p>
            </CardContent>
          </Card>
        ) : (
          reviews?.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Mood: <span className="font-semibold">{review.mood}/10</span></p>
                  <p>Energy: <span className="font-semibold">{review.energy}/10</span></p>
                </div>

                {review.wins && (
                  <div className="bg-green-50 p-2 rounded text-sm">
                    <p className="font-medium text-green-900">Wins:</p>
                    <p className="text-green-800">{review.wins}</p>
                  </div>
                )}

                {review.misses && (
                  <div className="bg-yellow-50 p-2 rounded text-sm">
                    <p className="font-medium text-yellow-900">Misses:</p>
                    <p className="text-yellow-800">{review.misses}</p>
                  </div>
                )}

                {review.tomorrowFocus && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <p className="font-medium text-blue-900">Tomorrow's Focus:</p>
                    <p className="text-blue-800">{review.tomorrowFocus}</p>
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
