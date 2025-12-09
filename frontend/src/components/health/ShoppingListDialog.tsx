import { useState, useEffect } from 'react';
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
import { X, Plus } from 'lucide-react';
import type { ShoppingList, ShoppingListItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shoppingList?: ShoppingList;
  onSave: () => void;
}

export function ShoppingListDialog({ open, onOpenChange, shoppingList, onSave }: ShoppingListDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(shoppingList?.name || '');
  const [items, setItems] = useState<ShoppingListItem[]>(
    shoppingList?.items || [{ name: '', quantity: '', checked: false }]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shoppingList) {
      setName(shoppingList.name);
      setItems(shoppingList.items.length > 0 ? shoppingList.items : [{ name: '', quantity: '', checked: false }]);
    } else {
      setName('');
      setItems([{ name: '', quantity: '', checked: false }]);
    }
  }, [shoppingList, open]);

  function addItem() {
    setItems([...items, { name: '', quantity: '', checked: false }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ShoppingListItem, value: string | boolean) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser) return;

    // Filter out empty items
    const validItems = items.filter((item) => item.name.trim() !== '');

    if (validItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the shopping list',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const listData = {
        userId: currentUser.uid,
        name: name.trim(),
        items: validItems,
        updatedAt: new Date(),
        ...(shoppingList ? {} : { createdAt: new Date() }),
      };

      if (shoppingList) {
        // Update existing list
        await updateDoc(doc(db, 'shoppingLists', shoppingList.id), listData);
        toast({
          title: 'Success',
          description: 'Shopping list updated successfully',
        });
      } else {
        // Create new list
        await addDoc(collection(db, 'shoppingLists'), {
          ...listData,
          createdAt: new Date(),
        });
        toast({
          title: 'Success',
          description: 'Shopping list created successfully',
        });
      }

      // Reset form
      setName('');
      setItems([{ name: '', quantity: '', checked: false }]);
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving shopping list:', error);
      toast({
        title: 'Error',
        description: shoppingList ? 'Failed to update shopping list' : 'Failed to create shopping list',
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
          <DialogTitle>{shoppingList ? 'Edit Shopping List' : 'New Shopping List'}</DialogTitle>
          <DialogDescription>
            Create a shopping list to track items you need to purchase
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">List Name</Label>
            <Input
              id="name"
              placeholder="e.g., Weekly Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-2 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        required={index === 0 || item.name.trim() !== ''}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Quantity (optional)"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (shoppingList ? 'Updating...' : 'Creating...') : shoppingList ? 'Update List' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

