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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Event } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSave: () => void;
}

export function EventDialog({ open, onOpenChange, event, onSave }: EventDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<'academic' | 'personal' | 'wellness'>('personal');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title || '');
        setDate(event.date || '');
        setTime(event.time || '');
        setCategory(event.category || 'personal');
        setDescription(event.description || '');
      } else {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setTitle('');
        setDate(today);
        setTime('');
        setCategory('personal');
        setDescription('');
      }
    }
  }, [open, event]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Error',
        description: 'Date is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      if (event) {
        // Update existing event
        await api.updateEvent(event.id, {
          title,
          date,
          time: time || undefined,
          category,
          description: description || undefined,
        });
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        // Create new event
        await api.createEvent({
          title,
          date,
          time: time || undefined,
          category,
          description: description || undefined,
        });
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogDescription>
              {event ? 'Update your event details' : 'Add a new event to your calendar'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional event description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : event ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

