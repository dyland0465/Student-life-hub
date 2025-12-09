import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Event, CalendarSyncConfig } from '@/types';
import { EventList } from '@/components/calendar/EventList';
import { EventDialog } from '@/components/calendar/EventDialog';
import { CalendarSettingsDialog } from '@/components/calendar/CalendarSettingsDialog';
import { Plus, Settings, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function CalendarPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [config, setConfig] = useState<CalendarSyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'academic' | 'personal' | 'wellness'>('all');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  async function loadData() {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Load events for current month
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');
      
      const [eventsData, configData] = await Promise.all([
        api.getEvents(start, end),
        api.getCalendarSyncConfig(),
      ]);

      // Convert date strings to Date objects
      const processedEvents = eventsData.map((event: any) => ({
        ...event,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));

      setEvents(processedEvents);
      setConfig(configData);
    } catch (error: any) {
      console.error('Error loading calendar data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEventSave() {
    await loadData();
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await api.deleteEvent(eventId);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      await loadData();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete event',
        variant: 'destructive',
      });
    }
  }

  function handleEditEvent(event: Event) {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  }

  function handleCreateEvent() {
    setSelectedEvent(null);
    setEventDialogOpen(true);
  }

  const categoryCounts = {
    all: events.length,
    academic: events.filter(e => e.category === 'academic').length,
    personal: events.filter(e => e.category === 'personal').length,
    wellness: events.filter(e => e.category === 'wellness').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            View and manage all your academic, personal, and wellness events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={handleCreateEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                {loading ? 'Loading events...' : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All ({categoryCounts.all})
                  </SelectItem>
                  <SelectItem value="academic">
                    Academic ({categoryCounts.academic})
                  </SelectItem>
                  <SelectItem value="personal">
                    Personal ({categoryCounts.personal})
                  </SelectItem>
                  <SelectItem value="wellness">
                    Wellness ({categoryCounts.wellness})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <EventList
              events={events}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              categoryFilter={categoryFilter}
            />
          )}
        </CardContent>
      </Card>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        onSave={handleEventSave}
      />

      <CalendarSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        config={config}
        onConfigChange={loadData}
      />
    </div>
  );
}

