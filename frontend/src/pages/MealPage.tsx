import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, UtensilsCrossed, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Meal } from '@/types';
import { MealDialog } from '@/components/health/MealDialog';
import { MealCard } from '@/components/health/MealCard';
import { aiService } from '@/lib/ai-service';

export function MealPage() {
  const { currentUser } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [mealRecommendations, setMealRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadMealData();
    }
  }, [currentUser]);

  async function loadMealData() {
    if (!currentUser) return;

    try {
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
    } catch (error) {
      console.error('Error loading meal data:', error);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meal Tracking</h2>
          <p className="text-muted-foreground">Log your daily meals and track nutrition</p>
        </div>
        <Button onClick={() => setMealDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Log Meal
        </Button>
      </div>

      {/* Today's Nutrition Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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

      {/* Meal Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              className="w-full sm:w-auto"
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
                        setMealDialogOpen(true);
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

      {/* Meal History */}
      <Card>
        <CardHeader>
          <CardTitle>Meal History</CardTitle>
          <CardDescription>Your logged meals</CardDescription>
        </CardHeader>
        <CardContent>
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
                <MealCard key={meal.id} meal={meal} onUpdate={loadMealData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MealDialog
        open={mealDialogOpen}
        onOpenChange={setMealDialogOpen}
        onSave={loadMealData}
      />
    </div>
  );
}

