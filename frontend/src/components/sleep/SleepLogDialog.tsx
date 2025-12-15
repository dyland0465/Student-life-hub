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
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface SleepLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SleepLogDialog({ open, onOpenChange, onSave }: SleepLogDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [quality, setQuality] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function calculateHours(bed: string, wake: string): number {
    const bedDate = new Date(`2000-01-01T${bed}`);
    let wakeDate = new Date(`2000-01-01T${wake}`);
    
    if (wakeDate <= bedDate) {
      wakeDate = new Date(`2000-01-02T${wake}`);
    }
    
    const diff = wakeDate.getTime() - bedDate.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser) return;

    try {
      setLoading(true);

      const actualHours = calculateHours(bedTime, wakeTime);

      await addDoc(collection(db, 'sleepLogs'), {
        userId: currentUser.uid,
        date: new Date(date),
        bedTime,
        wakeTime,
        actualHours,
        quality: quality || null,
        notes,
      });

      toast({
        title: 'Success',
        description: 'Sleep logged successfully',
      });

      setDate(new Date().toISOString().slice(0, 10));
      setBedTime('');
      setWakeTime('');
      setQuality('');
      setNotes('');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error logging sleep:', error);
      toast({
        title: 'Error',
        description: 'Failed to log sleep',
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
          <DialogTitle>Log Sleep</DialogTitle>
          <DialogDescription>Record your sleep session</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedTime">Bed Time</Label>
              <Input
                id="bedTime"
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wakeTime">Wake Time</Label>
              <Input
                id="wakeTime"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                required
              />
            </div>
          </div>

          {bedTime && wakeTime && (
            <div className="text-sm text-muted-foreground">
              Total sleep: {calculateHours(bedTime, wakeTime)} hours
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quality">Sleep Quality (Optional)</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger>
                <SelectValue placeholder="How was your sleep?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any observations or factors affecting your sleep?"
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
              {loading ? 'Logging...' : 'Log Sleep'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

