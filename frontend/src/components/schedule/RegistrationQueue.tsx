import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RegistrationQueue } from '@/types';
import { Clock, CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationQueueProps {
  queue: RegistrationQueue[];
  onRefresh: () => void;
}

export function RegistrationQueue({ queue, onRefresh }: RegistrationQueueProps) {
  function getStatusBadge(status: RegistrationQueue['status']) {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'registering':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Registering
          </Badge>
        );
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  }

  if (queue.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registration Queue</CardTitle>
            <CardDescription>
              Your scheduled class registrations for upcoming semesters
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {queue.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(item.status)}
                    {item.lionPathConnected ? (
                      <Badge variant="outline" className="text-xs">
                        LionPath Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Not Connected
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Registration Date:</span>
                      <span className="font-medium">
                        {format(new Date(item.registrationDate), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Attempts:</span>
                      <span className="font-medium">{item.attempts}</span>
                    </div>
                    {item.lastAttempt && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Last Attempt:</span>
                        <span className="font-medium">
                          {format(new Date(item.lastAttempt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium mb-1">Sections to Register:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.sections.map((section, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {section.courseCode} {section.sectionNumber}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {item.error && (
                    <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      Error: {item.error}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

