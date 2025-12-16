import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, Sparkles } from 'lucide-react';
import type { ShoppingList, Meal } from '@/types';
import { ShoppingListDialog } from '@/components/health/ShoppingListDialog';
import { ShoppingListCard } from '@/components/health/ShoppingListCard';
import { aiService } from '@/lib/ai-service';
import { api } from '@/lib/api';

export function ShoppingListPage() {
  const { currentUser } = useAuth();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [shoppingListDialogOpen, setShoppingListDialogOpen] = useState(false);
  const [shoppingSuggestions, setShoppingSuggestions] = useState<{
    items: Array<{ name: string; quantity: string }>;
    suggestions: string[];
  } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadShoppingData();
    }
  }, [currentUser]);

  async function loadShoppingData() {
    if (!currentUser) return;

    try {
      // Load shopping lists from API
      const loadedShoppingLists = await api.getShoppingLists();
      const listsWithDates = loadedShoppingLists.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt),
        updatedAt: new Date(list.updatedAt),
      })) as ShoppingList[];
      setShoppingLists(listsWithDates);

      // Load recent meals for AI suggestions from API
      const loadedMeals = await api.getMeals(10);
      const mealsWithDates = loadedMeals.map((meal: any) => ({
        ...meal,
        date: new Date(meal.date),
        createdAt: new Date(meal.createdAt),
      })) as Meal[];
      setMeals(mealsWithDates);
    } catch (error) {
      console.error('Error loading shopping data:', error);
      setShoppingLists([]);
      setMeals([]);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shopping lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shopping Lists</h2>
          <p className="text-muted-foreground">Manage your shopping lists</p>
        </div>
        <Button onClick={() => setShoppingListDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </div>

      {/* AI Shopping List Suggestions */}
      <Card>
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
                  setShoppingListDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create List from Suggestions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shopping Lists */}
      <Card>
        <CardHeader>
          <CardTitle>My Shopping Lists</CardTitle>
          <CardDescription>Your shopping lists</CardDescription>
        </CardHeader>
        <CardContent>
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
                <ShoppingListCard key={list.id} shoppingList={list} onUpdate={loadShoppingData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShoppingListDialog
        open={shoppingListDialogOpen}
        onOpenChange={setShoppingListDialogOpen}
        onSave={loadShoppingData}
      />
    </div>
  );
}

