'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { Event, EventStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Package,
} from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-200 text-gray-800 border-gray-300',
  QUOTED: 'bg-purple-200 text-purple-800 border-purple-300',
  CONFIRMED: 'bg-blue-200 text-blue-800 border-blue-300',
  IN_PROGRESS: 'bg-amber-200 text-amber-800 border-amber-300',
  COMPLETED: 'bg-green-200 text-green-800 border-green-300',
  CANCELLED: 'bg-red-200 text-red-800 border-red-300',
};

const statusDotColors: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  QUOTED: 'bg-purple-500',
  CONFIRMED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export default function EventCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch calendar events for the visible range (includes padding days)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'calendar', format(monthStart, 'yyyy-MM'), statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        startDate: calendarStart.toISOString(),
        endDate: calendarEnd.toISOString(),
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await api.get('/events/calendar', { params });
      return res.data as Event[];
    },
  });

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart.getTime(), calendarEnd.getTime()]);

  // Map events to days
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      calendarDays.forEach((day) => {
        if (day >= new Date(start.toDateString()) && day <= new Date(end.toDateString())) {
          const key = format(day, 'yyyy-MM-dd');
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(event);
        }
      });
    });
    return map;
  }, [events, calendarDays]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDay.get(key) || [];
    if (dayEvents.length > 0) {
      setSelectedDay(day);
      setDayDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/events">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Events
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Event Calendar
          </h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy')} — {events.length} events
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="QUOTED">Quoted</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-2">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-t border-l">
            {calendarDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(key) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <div
                  key={key}
                  className={`min-h-[100px] border-r border-b p-1 cursor-pointer transition-colors hover:bg-accent/50 ${
                    !isCurrentMonth ? 'bg-muted/30' : ''
                  } ${today ? 'bg-primary/5' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium inline-flex items-center justify-center h-7 w-7 rounded-full ${
                        today
                          ? 'bg-primary text-primary-foreground'
                          : !isCurrentMonth
                          ? 'text-muted-foreground'
                          : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate border ${
                          statusColors[event.status] || 'bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        title={event.name}
                      >
                        {event.name}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            {Object.entries(statusDotColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-xs text-muted-foreground">
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Events This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              {isLoading ? 'Loading...' : 'No events this month'}
            </p>
          ) : (
            <div className="space-y-2">
              {events
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${statusDotColors[event.status] || 'bg-gray-400'}`}
                      />
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.startDate), 'EEE, MMM dd')} &middot;{' '}
                          {format(new Date(event.startDate), 'HH:mm')} -{' '}
                          {format(new Date(event.endDate), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {(event as any).client?.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[event.status]}
                      >
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <Badge className={statusColors[selectedEvent.status]}>
                {selectedEvent.status.replace('_', ' ')}
              </Badge>

              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedEvent.startDate), 'EEE, MMM dd yyyy, HH:mm')} —{' '}
                    {format(new Date(selectedEvent.endDate), 'HH:mm')}
                  </span>
                </div>
                {selectedEvent.venue && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.venue}</span>
                  </div>
                )}
                {(selectedEvent as any).client?.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{(selectedEvent as any).client.name}</span>
                  </div>
                )}
                {selectedEvent._count && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedEvent._count.equipmentBookings} equipment &middot;{' '}
                      {selectedEvent._count.staffAssignments} staff
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </>
              )}

              <div className="flex justify-end">
                <Link href={`/events/${selectedEvent.id}`}>
                  <Button size="sm">View Full Details</Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Day Detail Dialog */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM dd, yyyy')}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-2">
              {(eventsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || []).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setDayDialogOpen(false);
                    setSelectedEvent(event);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${statusDotColors[event.status] || 'bg-gray-400'}`}
                    />
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.startDate), 'HH:mm')} -{' '}
                        {format(new Date(event.endDate), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[event.status]}>
                    {event.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
