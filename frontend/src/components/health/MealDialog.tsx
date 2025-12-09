import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Meal } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface MealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal?: Meal;
  onSave: () => void;
}

export function MealDialog({ open, onOpenChange, meal, onSave }: MealDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [mealType, setMealType] = useState<Meal['mealType']>(meal?.mealType || 'Breakfast');
  const [foodName, setFoodName] = useState(meal?.foodName || '');
  const [calories, setCalories] = useState(meal?.calories.toString() || '');
  const [protein, setProtein] = useState(meal?.protein.toString() || '');
  const [carbs, setCarbs] = useState(meal?.carbs.toString() || '');
  const [fats, setFats] = useState(meal?.fats.toString() || '');
  const [date, setDate] = useState(
    meal?.date ? new Date(meal.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState(meal?.notes || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser) return;

    try {
      setLoading(true);

      const mealData = {
        userId: currentUser.uid,
        mealType,
        foodName,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        date: new Date(date),
        notes: notes || null,
        createdAt: meal?.createdAt || new Date(),
      };

      if (meal) {
        // Update existing meal
        await updateDoc(doc(db, 'meals', meal.id), mealData);
        toast({
          title: 'Success',
          description: 'Meal updated successfully',
        });
      } else {
        // Create new meal
        await addDoc(collection(db, 'meals'), mealData);
        toast({
          title: 'Success',
          description: 'Meal logged successfully',
        });
      }

      // Reset form
      setMealType('Breakfast');
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setDate(new Date().toISOString().slice(0, 16));
      setNotes('');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving meal:', error);
      toast({
        title: 'Error',
        description: meal ? 'Failed to update meal' : 'Failed to log meal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meal ? 'Edit Meal' : 'Log Meal'}</DialogTitle>
          <DialogDescription>Record your meal with nutritional information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealType">Meal Type</Label>
              <Select value={mealType} onValueChange={(value) => setMealType(value as Meal['mealType'])} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foodName">Food Name</Label>
            <Input
              id="foodName"
              placeholder="e.g., Grilled Chicken Salad"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fats">Fats (g)</Label>
              <Input
                id="fats"
                type="number"
                placeholder="0"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this meal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (meal ? 'Updating...' : 'Logging...') : meal ? 'Update Meal' : 'Log Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

