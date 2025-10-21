import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Dumbbell, TrendingUp, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FitnessRoutine, WorkoutLog } from '@/types';
import { RoutineDialog } from '@/components/health/RoutineDialog';
import { WorkoutDialog } from '@/components/health/WorkoutDialog';
import { WorkoutCard } from '@/components/health/WorkoutCard';

export function HealthPage() {
  const { currentUser } = useAuth();
  const [routines, setRoutines] = useState<FitnessRoutine[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadHealthData();
    }
  }, [currentUser]);

  async function loadHealthData() {
    if (!currentUser) return;

    try {
      // Load fitness routines
      const routinesRef = collection(db, 'fitnessRoutines');
      const routinesQuery = query(routinesRef, where('userId', '==', currentUser.uid));
      const routinesSnapshot = await getDocs(routinesQuery);
      const loadedRoutines = routinesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as FitnessRoutine[];
      setRoutines(loadedRoutines);

      // Load workout logs
      const logsRef = collection(db, 'workoutLogs');
      const logsQuery = query(
        logsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(20)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const loadedLogs = logsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate() || new Date(),
      })) as WorkoutLog[];
      setWorkoutLogs(loadedLogs);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalWorkouts = workoutLogs.length;
  const totalMinutes = workoutLogs.reduce((sum, log) => sum + log.duration, 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Health & Fitness</h2>
          <p className="text-muted-foreground">Track your workouts and fitness goals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRoutineDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Routine
          </Button>
          <Button onClick={() => setWorkoutDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Workout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMinutes} min</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration} min</div>
            <p className="text-xs text-muted-foreground">Per workout</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Fitness Recommendations
          </CardTitle>
          <CardDescription>Personalized workout suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                    Morning Cardio Session
                  </h4>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Start your day with a 30-minute cardio routine to boost energy and focus for your classes.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Strength Training
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Build muscle and improve overall fitness with 45-minute strength sessions 3x per week.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Routines and Workout History */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Workout History</TabsTrigger>
          <TabsTrigger value="routines">My Routines</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your workout history and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No workouts logged yet. Start tracking your fitness journey!
                </p>
              ) : (
                <div className="space-y-3">
                  {workoutLogs.map((log) => (
                    <WorkoutCard key={log.id} workout={log} onUpdate={loadHealthData} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fitness Routines</CardTitle>
              <CardDescription>Your saved workout routines</CardDescription>
            </CardHeader>
            <CardContent>
              {routines.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No routines created yet. Create your first routine!
                  </p>
                  <Button onClick={() => setRoutineDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Routine
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {routines.map((routine) => (
                    <Card key={routine.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{routine.routineName}</CardTitle>
                        <CardDescription>{routine.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="text-muted-foreground">Duration:</span> {routine.duration} minutes</p>
                          {routine.description && (
                            <p className="text-sm text-muted-foreground">{routine.description}</p>
                          )}
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              setWorkoutDialogOpen(true);
                            }}
                          >
                            Log This Routine
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RoutineDialog
        open={routineDialogOpen}
        onOpenChange={setRoutineDialogOpen}
        onSave={loadHealthData}
      />

      <WorkoutDialog
        open={workoutDialogOpen}
        onOpenChange={setWorkoutDialogOpen}
        routines={routines}
        onSave={loadHealthData}
      />
    </div>
  );
}

