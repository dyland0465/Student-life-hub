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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { CalendarSyncConfig } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GoogleCalendarConnect } from './GoogleCalendarConnect';
import { AppleCalendarConnect } from './AppleCalendarConnect';

interface CalendarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CalendarSyncConfig | null;
  onConfigChange: () => void;
}

export function CalendarSettingsDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: CalendarSettingsDialogProps) {
  const { toast } = useToast();
  const [eventSources, setEventSources] = useState({
    assignments: true,
    workouts: false,
    meals: false,
    sleep: false,
  });
  const [syncFrequency, setSyncFrequency] = useState<'realtime' | 'hourly' | 'daily'>('hourly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setEventSources(config.eventSources);
      setSyncFrequency(config.syncFrequency);
    }
  }, [config]);

  async function handleSave() {
    try {
      setLoading(true);
      await api.updateCalendarSyncConfig({
        eventSources,
        syncFrequency,
      });
      toast({
        title: 'Success',
        description: 'Calendar settings updated',
      });
      onConfigChange();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar Settings</DialogTitle>
          <DialogDescription>
            Configure which events appear in your calendar and sync settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Event Sources</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which types of events to include in your calendar
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="assignments">Assignments</Label>
                    <p className="text-xs text-muted-foreground">
                      Show assignment due dates as academic events
                    </p>
                  </div>
                  <Switch
                    id="assignments"
                    checked={eventSources.assignments}
                    onCheckedChange={(checked) =>
                      setEventSources({ ...eventSources, assignments: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="workouts">Workouts</Label>
                    <p className="text-xs text-muted-foreground">
                      Show workout logs as wellness events
                    </p>
                  </div>
                  <Switch
                    id="workouts"
                    checked={eventSources.workouts}
                    onCheckedChange={(checked) =>
                      setEventSources({ ...eventSources, workouts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="meals">Meals</Label>
                    <p className="text-xs text-muted-foreground">
                      Show meal logs as wellness events
                    </p>
                  </div>
                  <Switch
                    id="meals"
                    checked={eventSources.meals}
                    onCheckedChange={(checked) =>
                      setEventSources({ ...eventSources, meals: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sleep">Sleep</Label>
                    <p className="text-xs text-muted-foreground">
                      Show bedtime and wake times as wellness events
                    </p>
                  </div>
                  <Switch
                    id="sleep"
                    checked={eventSources.sleep}
                    onCheckedChange={(checked) =>
                      setEventSources({ ...eventSources, sleep: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="syncFrequency">Sync Frequency</Label>
              <Select
                value={syncFrequency}
                onValueChange={(value: any) => setSyncFrequency(value)}
              >
                <SelectTrigger id="syncFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to sync with external calendars
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">External Calendar Sync</h3>
              <GoogleCalendarConnect
                config={config}
                onConfigChange={onConfigChange}
              />
              <AppleCalendarConnect
                config={config}
                onConfigChange={onConfigChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

