import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';
import { format, parseISO, isSameDay } from 'date-fns';
import { Edit, Trash2, BookOpen, Heart, Calendar as CalendarIcon } from 'lucide-react';

interface EventListProps {
  events: Event[];
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  categoryFilter?: 'academic' | 'personal' | 'wellness' | 'all';
}

export function EventList({ events, onEdit, onDelete, categoryFilter = 'all' }: EventListProps) {
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return events;
    return events.filter(e => e.category === categoryFilter);
  }, [events, categoryFilter]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: Event[] } = {};
    
    filteredEvents.forEach(event => {
      const dateKey = event.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Sort events within each date by time
    sortedDates.forEach(date => {
      groups[date].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return { groups, sortedDates };
  }, [filteredEvents]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'wellness':
        return <Heart className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'wellness':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'personal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isSameDay(date, today)) {
      return `Today - ${format(date, 'MMMM d, yyyy')}`;
    } else if (isSameDay(date, tomorrow)) {
      return `Tomorrow - ${format(date, 'MMMM d, yyyy')}`;
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No events found</p>
        {categoryFilter !== 'all' && (
          <p className="text-sm mt-2">Try changing the category filter</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEvents.sortedDates.map(dateKey => (
        <div key={dateKey}>
          <h3 className="text-lg font-semibold mb-3 sticky top-0 bg-background py-2 z-10">
            {formatDateHeader(dateKey)}
          </h3>
          <div className="space-y-2">
            {groupedEvents.groups[dateKey].map(event => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={`${getCategoryColor(event.category)} flex items-center gap-1`}
                        >
                          {getCategoryIcon(event.category)}
                          <span className="capitalize">{event.category}</span>
                        </Badge>
                        {event.source && event.source !== 'manual' && (
                          <Badge variant="outline" className="text-xs">
                            {event.source}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{event.title}</h4>
                      {event.time && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {event.time}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    {event.source === 'manual' && (onEdit || onDelete) && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

