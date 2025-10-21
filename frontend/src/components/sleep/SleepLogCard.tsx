import type { SleepLog } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon } from 'lucide-react';
import { format } from 'date-fns';

interface SleepLogCardProps {
  log: SleepLog;
  onUpdate: () => void;
}

const qualityColors = {
  poor: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  good: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  excellent: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
};

export function SleepLogCard({ log }: SleepLogCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">{format(log.date, 'EEEE, MMMM d')}</h4>
              <p className="text-sm text-muted-foreground">
                {log.bedTime} - {log.wakeTime}
              </p>
              {log.notes && (
                <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-lg font-bold">{log.actualHours}h</div>
            {log.quality && (
              <Badge className={qualityColors[log.quality]}>
                {log.quality.charAt(0).toUpperCase() + log.quality.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

