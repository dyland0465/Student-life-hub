import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { GeneratedSchedule } from '@/types';
import { Calendar, AlertCircle, CheckCircle2, Clock, User, MapPin } from 'lucide-react';

interface SchedulePreviewProps {
  schedule: GeneratedSchedule;
  onAddToQueue: () => void;
  onRegenerate: () => void;
  lionPathConnected: boolean;
}

export function SchedulePreview({
  schedule,
  onAddToQueue,
  onRegenerate,
  lionPathConnected,
}: SchedulePreviewProps) {
  // Group schedule by day for calendar view
  type DaySchedule = { section: typeof schedule.sections[0]; classTime: typeof schedule.sections[0]['schedule'][0] };
  const scheduleByDay: Record<string, DaySchedule[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  schedule.sections.forEach((section) => {
    section.schedule.forEach((classTime) => {
      if (scheduleByDay[classTime.day]) {
        scheduleByDay[classTime.day].push({ section, classTime });
      }
    });
  });

  const totalCredits = schedule.sections.reduce((sum, s) => sum + s.credits, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Generated Schedule
            </CardTitle>
            <CardDescription>
              Optimization Score: <span className="font-semibold">{schedule.score}/100</span>
            </CardDescription>
          </div>
          <Badge variant={schedule.score >= 80 ? 'default' : schedule.score >= 60 ? 'secondary' : 'destructive'}>
            Score: {schedule.score}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conflicts */}
        {schedule.conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Conflicts Detected:</div>
              <ul className="list-disc list-inside space-y-1">
                {schedule.conflicts.map((conflict, index) => (
                  <li key={index}>{conflict.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Schedule Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Credits</p>
            <p className="text-2xl font-bold">{totalCredits}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Courses</p>
            <p className="text-2xl font-bold">{schedule.sections.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Conflicts</p>
            <p className="text-2xl font-bold">{schedule.conflicts.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold">{schedule.score}</p>
          </div>
        </div>

        {/* Weekly Schedule View */}
        <div>
          <h4 className="font-semibold mb-3">Weekly Schedule</h4>
          <div className="space-y-3">
            {Object.entries(scheduleByDay).map(([day, daySchedules]) => {
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="border rounded-lg p-3">
                  <div className="font-medium mb-2">{day}</div>
                  <div className="space-y-2">
                    {daySchedules.map(({ section, classTime }, index) => (
                      <div
                        key={`${section.courseCode}-${day}-${index}`}
                        className="flex items-start gap-3 p-2 bg-muted rounded"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{section.courseCode}</span>
                            <Badge variant="outline" className="text-xs">
                              {section.sectionNumber}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {section.courseName}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {classTime.startTime} - {classTime.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {section.professor}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course List */}
        <div>
          <h4 className="font-semibold mb-3">Selected Courses</h4>
          <div className="space-y-2">
            {schedule.sections.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{section.courseCode}</span>
                    <Badge variant="secondary">{section.credits} credits</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{section.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    Section {section.sectionNumber} • {section.professor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onRegenerate} className="flex-1">
            Regenerate Schedule
          </Button>
          <Button
            onClick={onAddToQueue}
            className="flex-1"
            disabled={!lionPathConnected || schedule.conflicts.length > 0}
          >
            {lionPathConnected ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Add to Registration Queue
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Connect LionPath First
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

