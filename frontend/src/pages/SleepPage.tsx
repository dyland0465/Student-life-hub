import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Moon, TrendingUp, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SleepLog, SleepSchedule } from '@/types';
import { SleepLogDialog } from '@/components/sleep/SleepLogDialog';
import { SleepScheduleDialog } from '@/components/sleep/SleepScheduleDialog';
import { SleepLogCard } from '@/components/sleep/SleepLogCard';

export function SleepPage() {
  const { currentUser } = useAuth();
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadSleepData();
    }
  }, [currentUser]);

  async function loadSleepData() {
    if (!currentUser) return;

    try {
      // Load sleep schedule
      const scheduleDoc = await getDoc(doc(db, 'sleepSchedules', currentUser.uid));
      if (scheduleDoc.exists()) {
        setSleepSchedule(scheduleDoc.data() as SleepSchedule);
      }

      // Load sleep logs
      const logsRef = collection(db, 'sleepLogs');
      const logsQuery = query(
        logsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(30)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const loadedLogs = logsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate() || new Date(),
      })) as SleepLog[];
      setSleepLogs(loadedLogs);
    } catch (error) {
      console.error('Error loading sleep data:', error);
    } finally {
      setLoading(false);
    }
  }

  const avgSleepHours =
    sleepLogs.length > 0
      ? sleepLogs.reduce((sum, log) => sum + log.actualHours, 0) / sleepLogs.length
      : 0;

  const consistency = sleepLogs.length > 1 ? calculateConsistency(sleepLogs) : 100;

  function calculateConsistency(logs: SleepLog[]): number {
    if (logs.length < 2) return 100;
    
    const hours = logs.map((l) => l.actualHours);
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, Math.min(100, 100 - stdDev * 20));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sleep data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sleep Schedule</h2>
          <p className="text-muted-foreground">Track and optimize your sleep patterns</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setScheduleDialogOpen(true)} variant="outline" className="flex-1 sm:flex-initial">
            <Moon className="mr-2 h-4 w-4" />
            {sleepSchedule ? 'Update Schedule' : 'Set Schedule'}
          </Button>
          <Button onClick={() => setLogDialogOpen(true)} className="flex-1 sm:flex-initial">
            <Plus className="mr-2 h-4 w-4" />
            Log Sleep
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sleep</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSleepHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Per night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consistency.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Sleep regularity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Schedule</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sleepSchedule ? (
              <>
                <div className="text-2xl font-bold">{sleepSchedule.targetHours}h</div>
                <p className="text-xs text-muted-foreground">
                  {sleepSchedule.bedTime} - {sleepSchedule.wakeTime}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">Not Set</div>
                <p className="text-xs text-muted-foreground">Set your schedule</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sleep Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sleep Insights
          </CardTitle>
          <CardDescription>Personalized recommendations for better sleep</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {avgSleepHours < 7 ? (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Increase Sleep Duration
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      You're averaging {avgSleepHours.toFixed(1)} hours of sleep. Try to get 7-8 hours for optimal health and academic performance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Great Sleep Duration!
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      You're getting {avgSleepHours.toFixed(1)} hours of sleep on average. Keep it up!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {consistency < 70 ? (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                <div className="flex items-start gap-3">
                  <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Improve Sleep Consistency
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Try to maintain a consistent sleep schedule, even on weekends. This helps regulate your body's internal clock.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Excellent Consistency!
                    </h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      Your sleep schedule is {consistency.toFixed(0)}% consistent. This is great for your overall health!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sleep Log History */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep History</CardTitle>
          <CardDescription>Your recent sleep patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {sleepLogs.length === 0 ? (
            <div className="text-center py-8">
              <Moon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No sleep logs yet. Start tracking your sleep!
              </p>
              <Button onClick={() => setLogDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Your First Sleep
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sleepLogs.map((log) => (
                <SleepLogCard key={log.id} log={log} onUpdate={loadSleepData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SleepLogDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        onSave={loadSleepData}
      />

      <SleepScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        schedule={sleepSchedule}
        onSave={loadSleepData}
      />
    </div>
  );
}

