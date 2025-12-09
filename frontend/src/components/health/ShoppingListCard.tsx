import { useState } from 'react';
import type { ShoppingList, ShoppingListItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ShoppingListDialog } from './ShoppingListDialog';
import { Progress } from '@/components/ui/progress';

interface ShoppingListCardProps {
  shoppingList: ShoppingList;
  onUpdate: () => void;
}

export function ShoppingListCard({ shoppingList, onUpdate }: ShoppingListCardProps) {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkedCount = shoppingList.items.filter((item) => item.checked).length;
  const totalItems = shoppingList.items.length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  async function handleItemToggle(index: number, checked: boolean) {
    try {
      setUpdating(true);
      const newItems = [...shoppingList.items];
      newItems[index] = { ...newItems[index], checked };
      await updateDoc(doc(db, 'shoppingLists', shoppingList.id), {
        items: newItems,
        updatedAt: new Date(),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this shopping list?')) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'shoppingLists', shoppingList.id));
      toast({
        title: 'Success',
        description: 'Shopping list deleted successfully',
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete shopping list',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <CardTitle>{shoppingList.name}</CardTitle>
            </div>
            <div className="flex gap-2">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {checkedCount} of {totalItems} items
            </span>
            <span>•</span>
            <span>Updated {format(shoppingList.updatedAt, 'PPP')}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          {shoppingList.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items in this list</p>
          ) : (
            <div className="space-y-2">
              {shoppingList.items.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    item.checked ? 'bg-muted opacity-60' : ''
                  }`}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) => handleItemToggle(index, checked as boolean)}
                    disabled={updating}
                  />
                  <div className="flex-1">
                    <span
                      className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-xs text-muted-foreground ml-2">({item.quantity})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShoppingListDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        shoppingList={shoppingList}
        onSave={onUpdate}
      />
    </>
  );
}

