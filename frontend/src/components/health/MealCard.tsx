import { useState } from 'react';
import type { Meal } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MealDialog } from './MealDialog';

interface MealCardProps {
  meal: Meal;
  onUpdate: () => void;
}

const mealTypeColors: Record<Meal['mealType'], string> = {
  Breakfast: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Lunch: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Dinner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Snack: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function MealCard({ meal, onUpdate }: MealCardProps) {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      setDeleting(true);
      await api.deleteMeal(meal.id);
      toast({
        title: 'Success',
        description: 'Meal deleted successfully',
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting meal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete meal',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`rounded-lg p-2 ${mealTypeColors[meal.mealType]}`}>
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{meal.foodName}</h4>
                  <Badge className={mealTypeColors[meal.mealType]}>{meal.mealType}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {format(meal.date, 'PPP p')}
                </p>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Calories:</span>
                    <span className="ml-1 font-medium">{meal.calories}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Protein:</span>
                    <span className="ml-1 font-medium">{meal.protein}g</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbs:</span>
                    <span className="ml-1 font-medium">{meal.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fats:</span>
                    <span className="ml-1 font-medium">{meal.fats}g</span>
                  </div>
                </div>
                {meal.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{meal.notes}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MealDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        meal={meal}
        onSave={onUpdate}
      />
    </>
  );
}

