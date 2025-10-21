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
import type { SleepSchedule } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface SleepScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: SleepSchedule | null;
  onSave: () => void;
}

export function SleepScheduleDialog({ open, onOpenChange, schedule, onSave }: SleepScheduleDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schedule) {
      setBedTime(schedule.bedTime);
      setWakeTime(schedule.wakeTime);
    } else {
      setBedTime('');
      setWakeTime('');
    }
  }, [schedule, open]);

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

      const targetHours = calculateHours(bedTime, wakeTime);

      await setDoc(doc(db, 'sleepSchedules', currentUser.uid), {
        id: currentUser.uid,
        userId: currentUser.uid,
        bedTime,
        wakeTime,
        targetHours,
      });

      toast({
        title: 'Success',
        description: 'Sleep schedule updated successfully',
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving sleep schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save sleep schedule',
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
          <DialogTitle>{schedule ? 'Update' : 'Set'} Sleep Schedule</DialogTitle>
          <DialogDescription>
            Set your target sleep and wake times
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bedTime">Target Bed Time</Label>
            <Input
              id="bedTime"
              type="time"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wakeTime">Target Wake Time</Label>
            <Input
              id="wakeTime"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              required
            />
          </div>

          {bedTime && wakeTime && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Target sleep duration: <strong>{calculateHours(bedTime, wakeTime)} hours</strong>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : schedule ? 'Update' : 'Set Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

