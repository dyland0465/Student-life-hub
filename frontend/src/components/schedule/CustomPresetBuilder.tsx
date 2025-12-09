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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ScheduleParameters } from '@/types';
// Using range input instead of slider component

interface CustomPresetBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPresetCreated: () => void;
}

export function CustomPresetBuilder({
  open,
  onOpenChange,
  onPresetCreated,
}: CustomPresetBuilderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [parameters, setParameters] = useState<ScheduleParameters>({
    prioritizeEasyProfessors: 50,
    prioritizeLateStart: 50,
    prioritizeEarlyEnd: 50,
    gapPreference: 'balanced',
    classSizePreference: 'any',
    onlinePreference: 'any',
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [avoidDays, setAvoidDays] = useState<string[]>([]);

  async function handleSave() {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a preset name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.createPreset(name, {
        ...parameters,
        avoidDays,
      });

      toast({
        title: 'Success',
        description: 'Custom preset created successfully',
      });

      onPresetCreated();
      onOpenChange(false);
      setName('');
      setParameters({
        prioritizeEasyProfessors: 50,
        prioritizeLateStart: 50,
        prioritizeEarlyEnd: 50,
        gapPreference: 'balanced',
        classSizePreference: 'any',
        onlinePreference: 'any',
      });
      setAvoidDays([]);
    } catch (error: any) {
      console.error('Error creating preset:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create preset',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(day: string) {
    if (avoidDays.includes(day)) {
      setAvoidDays(avoidDays.filter(d => d !== day));
    } else {
      setAvoidDays([...avoidDays, day]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Preset</DialogTitle>
          <DialogDescription>
            Adjust the parameters to create your perfect schedule optimization preset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="presetName">Preset Name</Label>
            <Input
              id="presetName"
              placeholder="My Perfect Schedule"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Professor Easiness */}
          <div className="space-y-2">
            <Label>
              Prioritize Easy Professors: {parameters.prioritizeEasyProfessors || 0}%
            </Label>
            <input
              type="range"
              min="0"
              max="100"
              value={parameters.prioritizeEasyProfessors || 0}
              onChange={(e) =>
                setParameters({ ...parameters, prioritizeEasyProfessors: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values prioritize professors with lower difficulty ratings
            </p>
          </div>

          {/* Start Time Preference */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Preferred Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={parameters.preferredStartTime || '08:00'}
              onChange={(e) =>
                setParameters({ ...parameters, preferredStartTime: e.target.value })
              }
            />
            <div className="space-y-2">
              <Label>
                Prioritize Late Start: {parameters.prioritizeLateStart || 0}%
              </Label>
              <input
                type="range"
                min="0"
                max="100"
                value={parameters.prioritizeLateStart || 0}
                onChange={(e) =>
                  setParameters({ ...parameters, prioritizeLateStart: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* End Time Preference */}
          <div className="space-y-2">
            <Label htmlFor="endTime">Preferred End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={parameters.preferredEndTime || '17:00'}
              onChange={(e) =>
                setParameters({ ...parameters, preferredEndTime: e.target.value })
              }
            />
            <div className="space-y-2">
              <Label>
                Prioritize Early End: {parameters.prioritizeEarlyEnd || 0}%
              </Label>
              <input
                type="range"
                min="0"
                max="100"
                value={parameters.prioritizeEarlyEnd || 0}
                onChange={(e) =>
                  setParameters({ ...parameters, prioritizeEarlyEnd: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Days to Avoid */}
          <div className="space-y-2">
            <Label>Days to Avoid</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={avoidDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <Label
                    htmlFor={`day-${day}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Gap Preference */}
          <div className="space-y-2">
            <Label htmlFor="gapPreference">Gap Between Classes</Label>
            <Select
              value={parameters.gapPreference || 'balanced'}
              onValueChange={(value: 'minimize' | 'maximize' | 'balanced') =>
                setParameters({ ...parameters, gapPreference: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimize">Minimize Gaps</SelectItem>
                <SelectItem value="maximize">Maximize Gaps</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Size Preference */}
          <div className="space-y-2">
            <Label htmlFor="classSize">Class Size Preference</Label>
            <Select
              value={parameters.classSizePreference || 'any'}
              onValueChange={(value: 'small' | 'medium' | 'large' | 'any') =>
                setParameters({ ...parameters, classSizePreference: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (&lt;30 students)</SelectItem>
                <SelectItem value="medium">Medium (30-100 students)</SelectItem>
                <SelectItem value="large">Large (&gt;100 students)</SelectItem>
                <SelectItem value="any">Any Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Online Preference */}
          <div className="space-y-2">
            <Label htmlFor="onlinePreference">Online/In-Person Preference</Label>
            <Select
              value={parameters.onlinePreference || 'any'}
              onValueChange={(value: 'online' | 'in-person' | 'hybrid' | 'any') =>
                setParameters({ ...parameters, onlinePreference: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online Only</SelectItem>
                <SelectItem value="in-person">In-Person Only</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="any">Any Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Creating...' : 'Create Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

