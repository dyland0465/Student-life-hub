import type { WorkoutLog } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface WorkoutCardProps {
  workout: WorkoutLog;
  onUpdate: () => void;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">{workout.routineName}</h4>
              <p className="text-sm text-muted-foreground">
                {format(workout.date, 'PPP p')}
              </p>
              {workout.notes && (
                <p className="text-sm text-muted-foreground mt-1">{workout.notes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary">{workout.type}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{workout.duration} min</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

