import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Dumbbell, TrendingUp, Sparkles, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FitnessRoutine, WorkoutLog, Meal, ShoppingList } from '@/types';
import { RoutineDialog } from '@/components/health/RoutineDialog';
import { WorkoutDialog } from '@/components/health/WorkoutDialog';
import { WorkoutCard } from '@/components/health/WorkoutCard';
import { MealDialog } from '@/components/health/MealDialog';
import { MealCard } from '@/components/health/MealCard';
import { ShoppingListDialog } from '@/components/health/ShoppingListDialog';
import { ShoppingListCard } from '@/components/health/ShoppingListCard';
import { aiService } from '@/lib/ai-service';

export function HealthPage() {
  const { currentUser } = useAuth();
  const [routines, setRoutines] = useState<FitnessRoutine[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [shoppingListDialogOpen, setShoppingListDialogOpen] = useState(false);
  const [mealRecommendations, setMealRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [shoppingSuggestions, setShoppingSuggestions] = useState<{
    items: Array<{ name: string; quantity: string }>;
    suggestions: string[];
  } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

      // Load meals
      const mealsRef = collection(db, 'meals');
      const mealsQuery = query(
        mealsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(50)
      );
      const mealsSnapshot = await getDocs(mealsQuery);
      const loadedMeals = mealsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Meal[];
      setMeals(loadedMeals);

      // Load shopping lists
      const shoppingListsRef = collection(db, 'shoppingLists');
      const shoppingListsQuery = query(
        shoppingListsRef,
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const shoppingListsSnapshot = await getDocs(shoppingListsQuery);
      const loadedShoppingLists = shoppingListsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ShoppingList[];
      setShoppingLists(loadedShoppingLists);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalWorkouts = workoutLogs.length;
  const totalMinutes = workoutLogs.reduce((sum, log) => sum + log.duration, 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

  // Meal statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMeals = meals.filter((meal) => {
    const mealDate = new Date(meal.date);
    mealDate.setHours(0, 0, 0, 0);
    return mealDate.getTime() === today.getTime();
  });
  const todayCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const todayProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const todayCarbs = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const todayFats = todayMeals.reduce((sum, meal) => sum + meal.fats, 0);

  async function loadMealRecommendations() {
    setLoadingRecommendations(true);
    try {
      const recommendations = await aiService.getMealRecommendations({
        mealHistory: meals.slice(0, 10),
        targetCalories: 2000,
      });
      setMealRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading meal recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function loadShoppingSuggestions() {
    setLoadingSuggestions(true);
    try {
      const suggestions = await aiService.getShoppingListSuggestions({
        recentMeals: meals.slice(0, 10),
      });
      setShoppingSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading shopping suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function handleCreateListFromSuggestions() {
    if (!shoppingSuggestions) return;
    // This will be handled by opening the dialog with pre-filled items
    // For now, we'll just show the suggestions
  }

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

      {/* Tabs for Routines, Workout History, Meals, and Shopping Lists */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">Workout History</TabsTrigger>
          <TabsTrigger value="routines">My Routines</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="shopping">Shopping Lists</TabsTrigger>
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

        <TabsContent value="meals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Meal Tracking</CardTitle>
                  <CardDescription>Log your daily meals and track nutrition</CardDescription>
                </div>
                <Button onClick={() => setMealDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Meal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Today's Nutrition Stats */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayCalories}</div>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Protein</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayProtein.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">grams</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Carbs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayCarbs.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">grams</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayFats.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">grams</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Meal Recommendations */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Meal Recommendations
                      </CardTitle>
                      <CardDescription>Personalized meal suggestions based on your history</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMealRecommendations}
                      disabled={loadingRecommendations}
                    >
                      {loadingRecommendations ? 'Loading...' : 'Get Recommendations'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mealRecommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click "Get Recommendations" to see AI-powered meal suggestions
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {mealRecommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="rounded-lg bg-primary/5 p-4 border border-primary/20"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{rec.foodName}</h4>
                                <Badge variant="secondary">{rec.mealType}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Cal:</span>{' '}
                                  <span className="font-medium">{rec.calories}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">P:</span>{' '}
                                  <span className="font-medium">{rec.protein}g</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">C:</span>{' '}
                                  <span className="font-medium">{rec.carbs}g</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">F:</span>{' '}
                                  <span className="font-medium">{rec.fats}g</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Pre-fill meal dialog with recommendation
                                setMealDialogOpen(true);
                                // Note: We'd need to pass the recommendation data to MealDialog
                                // For now, user can manually enter
                              }}
                            >
                              Add to Log
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {meals.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No meals logged yet. Start tracking your nutrition!
                  </p>
                  <Button onClick={() => setMealDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Log Your First Meal
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onUpdate={loadHealthData} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shopping" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shopping Lists</CardTitle>
                  <CardDescription>Manage your shopping lists</CardDescription>
                </div>
                <Button onClick={() => setShoppingListDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* AI Shopping List Suggestions */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Shopping Suggestions
                      </CardTitle>
                      <CardDescription>Generate a shopping list from your meal history</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadShoppingSuggestions}
                      disabled={loadingSuggestions}
                    >
                      {loadingSuggestions ? 'Loading...' : 'Get Suggestions'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!shoppingSuggestions ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click "Get Suggestions" to generate a shopping list based on your meals
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Suggested Items:</h4>
                        <div className="space-y-1">
                          {shoppingSuggestions.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">•</span>
                              <span>{item.name}</span>
                              {item.quantity && (
                                <span className="text-muted-foreground">({item.quantity})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {shoppingSuggestions.suggestions && shoppingSuggestions.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Tips:</h4>
                          <ul className="space-y-1">
                            {shoppingSuggestions.suggestions.map((tip, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                • {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => {
                          // Create a new shopping list with suggested items
                          setShoppingListDialogOpen(true);
                          // Note: We'd need to pass the items to ShoppingListDialog
                          // For now, user can manually create and reference suggestions
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create List from Suggestions
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {shoppingLists.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No shopping lists yet. Create your first list!
                  </p>
                  <Button onClick={() => setShoppingListDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Shopping List
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {shoppingLists.map((list) => (
                    <ShoppingListCard key={list.id} shoppingList={list} onUpdate={loadHealthData} />
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

      <MealDialog
        open={mealDialogOpen}
        onOpenChange={setMealDialogOpen}
        onSave={loadHealthData}
      />

      <ShoppingListDialog
        open={shoppingListDialogOpen}
        onOpenChange={setShoppingListDialogOpen}
        onSave={loadHealthData}
      />
    </div>
  );
}

