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
import type { FitnessRoutine } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface WorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: FitnessRoutine[];
  onSave: () => void;
}

export function WorkoutDialog({ open, onOpenChange, routines, onSave }: WorkoutDialogProps) {
  const { toast } = useToast();
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [customName, setCustomName] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function handleRoutineSelect(routineId: string) {
    setSelectedRoutine(routineId);
    if (routineId === 'custom') {
      setCustomName('');
      setType('');
      setDuration('');
    } else {
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        setCustomName(routine.routineName);
        setType(routine.type);
        setDuration(routine.duration.toString());
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.createWorkout({
        routineId: selectedRoutine === 'custom' ? null : selectedRoutine,
        routineName: customName,
        type,
        duration: parseInt(duration),
        date: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: 'Workout logged successfully',
      });

      setSelectedRoutine('');
      setCustomName('');
      setType('');
      setDuration('');
      setNotes('');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error logging workout:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to log workout',
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
          <DialogTitle>Log Workout</DialogTitle>
          <DialogDescription>Record your workout session</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routine">Select Routine</Label>
            <Select value={selectedRoutine} onValueChange={handleRoutineSelect} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a routine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Workout</SelectItem>
                {routines.map((routine) => (
                  <SelectItem key={routine.id} value={routine.id}>
                    {routine.routineName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoutine && (
            <>
              <div className="space-y-2">
                <Label htmlFor="customName">Workout Name</Label>
                <Input
                  id="customName"
                  placeholder="Workout name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={selectedRoutine !== 'custom'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType} disabled={selectedRoutine !== 'custom'} required>
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
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How did it go?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedRoutine}>
              {loading ? 'Logging...' : 'Log Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

