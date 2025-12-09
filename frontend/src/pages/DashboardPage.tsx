import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Assignment, WorkoutLog, SleepLog } from '@/types';
import { Calendar, Dumbbell, Moon, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { format, isWithinInterval, addDays } from 'date-fns';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [recentSleep, setRecentSleep] = useState<SleepLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  async function loadDashboardData() {
    if (!currentUser) return;

    try {
      // Load upcoming assignments (next 7 days)
      const coursesRef = collection(db, 'courses');
      const coursesQuery = query(coursesRef, where('userId', '==', currentUser.uid));
      const coursesSnapshot = await getDocs(coursesQuery);

      const assignments: Assignment[] = [];
      const now = new Date();
      const nextWeek = addDays(now, 7);

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data();
        if (courseData.assignments) {
          courseData.assignments.forEach((assignment: any) => {
            const dueDate = assignment.dueDate.toDate();
            if (
              assignment.status === 'pending' &&
              isWithinInterval(dueDate, { start: now, end: nextWeek })
            ) {
              assignments.push({
                ...assignment,
                id: assignment.id || courseDoc.id + '-' + assignment.title,
                dueDate,
              });
            }
          });
        }
      }

      assignments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setUpcomingAssignments(assignments.slice(0, 5));

      // Load recent workouts
      const workoutsRef = collection(db, 'workoutLogs');
      const workoutsQuery = query(
        workoutsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(3)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date.toDate(),
      })) as WorkoutLog[];
      setRecentWorkouts(workouts);

      // Load most recent sleep log
      const sleepRef = collection(db, 'sleepLogs');
      const sleepQuery = query(
        sleepRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(1)
      );
      const sleepSnapshot = await getDocs(sleepQuery);
      if (!sleepSnapshot.empty) {
        const sleepData = sleepSnapshot.docs[0].data();
        setRecentSleep({
          ...sleepData,
          id: sleepSnapshot.docs[0].id,
          date: sleepData.date.toDate(),
        } as SleepLog);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Your personalized overview for {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentWorkouts.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentSleep ? `${recentSleep.actualHours}h` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Last night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Assignments */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Tasks due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming assignments. Great job staying ahead!
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {format(assignment.dueDate, 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Badge variant={assignment.aiSolved ? 'secondary' : 'outline'}>
                      {assignment.aiSolved ? 'AI Solved' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                <Link to="/coursework">
                  <Button variant="outline" className="w-full mt-2">
                    View All Assignments
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
            <CardDescription>To help you succeed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Study Schedule Optimization
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Based on your assignments, we recommend starting your upcoming project at least 3 days early.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4">
                <div className="flex items-start gap-3">
                  <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Sleep Pattern Insight
                    </h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      {recentSleep && recentSleep.actualHours < 7
                        ? 'Try to get more sleep. Aim for 7-8 hours tonight for better focus.'
                        : 'Great sleep habits! Keep maintaining your consistent schedule.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                <div className="flex items-start gap-3">
                  <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Fitness Suggestion
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {recentWorkouts.length === 0
                        ? 'Start your fitness journey! Even a 15-minute walk can boost your energy.'
                        : "You're on track! Consider adding variety to your workout routine."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

