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
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface RoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function RoutineDialog({ open, onOpenChange, onSave }: RoutineDialogProps) {
  const { toast } = useToast();
  const [routineName, setRoutineName] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.createRoutine({
        routineName,
        type,
        duration: parseInt(duration),
        description: description.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: 'Routine created successfully',
      });

      setRoutineName('');
      setType('');
      setDuration('');
      setDescription('');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating routine:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create routine',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Fitness Routine</DialogTitle>
          <DialogDescription>
            Create a new workout routine to track your fitness goals
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routineName">Routine Name</Label>
            <Input
              id="routineName"
              placeholder="Morning Run"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select workout type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cardio">Cardio</SelectItem>
                <SelectItem value="Strength">Strength</SelectItem>
                <SelectItem value="Yoga">Yoga</SelectItem>
                <SelectItem value="HIIT">HIIT</SelectItem>
                <SelectItem value="Flexibility">Flexibility</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your routine..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Routine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

