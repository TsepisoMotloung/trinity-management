'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, MapPin, Eye, Edit, Trash2, Users, Package, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import api, { getErrorMessage } from '@/lib/api';
import { Event, Client, User, EquipmentItem, EventStatus, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const statusColors: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: 'bg-gray-500',
  [EventStatus.QUOTED]: 'bg-blue-500',
  [EventStatus.CONFIRMED]: 'bg-green-600',
  [EventStatus.IN_PROGRESS]: 'bg-purple-600',
  [EventStatus.COMPLETED]: 'bg-emerald-600',
  [EventStatus.CANCELLED]: 'bg-red-600',
};

const emptyForm = {
  name: '', eventType: '', clientId: '', venue: '', venueAddress: '',
  startDate: '', endDate: '', setupTime: '', description: '', requirements: '', notes: '',
};
const eventTypes = ['Corporate Event', 'Wedding', 'Concert', 'Festival', 'Private Party', 'Conference', 'Church Service', 'Sports Event', 'Other'];

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<{ userId: string; role: string }[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await api.get<PaginatedResponse<Event>>(`/events?${params}`);
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => {
      const res = await api.get('/events/statistics');
      return res.data;
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Client>>('/clients?take=200');
      return res.data;
    },
  });

  // Fetch available equipment when dates are set
  const datesReady = !!(form.startDate && form.endDate);
  const { data: availableEquipment } = useQuery({
    queryKey: ['available-equipment', form.startDate, form.endDate, selectedEvent?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      if (selectedEvent?.id) params.append('excludeEventId', selectedEvent.id);
      const res = await api.get<EquipmentItem[]>(`/equipment/available?${params}`);
      return res.data;
    },
    enabled: datesReady,
  });

  // Fetch available staff when dates are set
  const { data: availableStaff } = useQuery({
    queryKey: ['available-staff', form.startDate, form.endDate, selectedEvent?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      if (selectedEvent?.id) params.append('excludeEventId', selectedEvent.id);
      const res = await api.get<User[]>(`/events/available-staff?${params}`);
      return res.data;
    },
    enabled: datesReady,
  });

  // Filter lists by search
  const filteredEquipment = useMemo(() => {
    if (!availableEquipment) return [];
    if (!equipmentSearch) return availableEquipment;
    const q = equipmentSearch.toLowerCase();
    return availableEquipment.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category?.name?.toLowerCase().includes(q) || e.serialNumber?.toLowerCase().includes(q)
    );
  }, [availableEquipment, equipmentSearch]);

  const filteredStaff = useMemo(() => {
    if (!availableStaff) return [];
    if (!staffSearch) return availableStaff;
    const q = staffSearch.toLowerCase();
    return availableStaff.filter(
      (s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [availableStaff, staffSearch]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/events', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      setIsAddOpen(false);
      setForm(emptyForm);
      setSelectedEquipmentIds([]);
      setSelectedStaff([]);
      toast.success('Event created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await api.patch(`/events/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEditOpen(false);
      setSelectedEvent(null);
      toast.success('Event updated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/events/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      toast.success('Event status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const buildPayload = () => {
    const p: Record<string, unknown> = {
      name: form.name, eventType: form.eventType, clientId: form.clientId,
      venue: form.venue, venueAddress: form.venueAddress || undefined,
      startDate: form.startDate, endDate: form.endDate,
      setupTime: form.setupTime || undefined,
      description: form.description || undefined,
      requirements: form.requirements || undefined,
      notes: form.notes || undefined,
    };
    if (selectedEquipmentIds.length) p.equipmentIds = selectedEquipmentIds;
    if (selectedStaff.length) p.staffAssignments = selectedStaff;
    return p;
  };

  const openEdit = (event: Event) => {
    setSelectedEvent(event);
    setForm({
      name: event.name, eventType: event.eventType, clientId: event.clientId,
      venue: event.venue, venueAddress: event.venueAddress || '',
      startDate: event.startDate?.slice(0, 16) || '',
      endDate: event.endDate?.slice(0, 16) || '',
      setupTime: event.setupTime?.slice(0, 16) || '',
      description: event.description || '', requirements: event.requirements || '',
      notes: event.notes || '',
    });
    setSelectedEquipmentIds(event.equipmentBookings?.map((b) => b.equipmentId) || []);
    setSelectedStaff(event.staffAssignments?.map((s) => ({ userId: s.userId, role: s.role })) || []);
    setEquipmentSearch('');
    setStaffSearch('');
    setIsEditOpen(true);
  };

  const EventForm = ({ onSubmit, isPending, label }: { onSubmit: () => void; isPending: boolean; label: string }) => (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-2">
        <Label>Event Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Annual Company Event" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event Type *</Label>
          <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clientsData?.items?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Venue *</Label>
        <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Grand Hotel Ballroom" />
      </div>
      <div className="space-y-2">
        <Label>Venue Address</Label>
        <Input value={form.venueAddress} onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} placeholder="Full address" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Setup Time</Label>
        <Input type="datetime-local" value={form.setupTime} onChange={(e) => setForm({ ...form, setupTime: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Requirements</Label>
        <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Equipment needs..." />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {/* ── Equipment Picker ── */}
      <div className="space-y-2 border rounded-lg p-3">
        <Label className="flex items-center gap-2"><Package className="h-4 w-4" />Equipment ({selectedEquipmentIds.length} selected)</Label>
        {!datesReady ? (
          <p className="text-sm text-muted-foreground">Set start & end dates to see available equipment.</p>
        ) : (
          <>
            <Input placeholder="Search equipment..." value={equipmentSearch} onChange={(e) => setEquipmentSearch(e.target.value)} className="h-8 text-sm" />
            <div className="max-h-44 overflow-y-auto space-y-1">
              {filteredEquipment.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No available equipment for these dates.</p>
              ) : filteredEquipment.map((item) => {
                const checked = selectedEquipmentIds.includes(item.id);
                return (
                  <label key={item.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                    <Checkbox checked={checked} onCheckedChange={() => setSelectedEquipmentIds((prev) => checked ? prev.filter((id) => id !== item.id) : [...prev, item.id])} />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.serialNumber}</span>
                    <Badge variant="outline" className="text-xs">{item.category?.name}</Badge>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Staff Picker ── */}
      <div className="space-y-2 border rounded-lg p-3">
        <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Staff ({selectedStaff.length} assigned)</Label>
        {!datesReady ? (
          <p className="text-sm text-muted-foreground">Set start & end dates to see available staff.</p>
        ) : (
          <>
            <Input placeholder="Search staff..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} className="h-8 text-sm" />
            <div className="max-h-44 overflow-y-auto space-y-1">
              {filteredStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No available staff for these dates.</p>
              ) : filteredStaff.map((user) => {
                const existing = selectedStaff.find((s) => s.userId === user.id);
                return (
                  <div key={user.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent text-sm">
                    <Checkbox checked={!!existing} onCheckedChange={() => setSelectedStaff((prev) => existing ? prev.filter((s) => s.userId !== user.id) : [...prev, { userId: user.id, role: 'Technician' }])} />
                    <span className="flex-1 truncate">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-muted-foreground">{user.role}</span>
                    {existing && (
                      <Select value={existing.role} onValueChange={(v) => setSelectedStaff((prev) => prev.map((s) => s.userId === user.id ? { ...s, role: v } : s))}>
                        <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sound Engineer">Sound Engineer</SelectItem>
                          <SelectItem value="Lighting Tech">Lighting Tech</SelectItem>
                          <SelectItem value="Technician">Technician</SelectItem>
                          <SelectItem value="DJ">DJ</SelectItem>
                          <SelectItem value="Stage Manager">Stage Manager</SelectItem>
                          <SelectItem value="Driver">Driver</SelectItem>
                          <SelectItem value="Setup Crew">Setup Crew</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={isPending || !form.name || !form.eventType || !form.clientId || !form.venue || !form.startDate || !form.endDate}>
        {isPending ? 'Saving...' : label}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage your events and bookings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/events/calendar">
            <Button variant="outline"><Calendar className="mr-2 h-4 w-4" />Calendar View</Button>
          </Link>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (open) { setForm(emptyForm); setSelectedEquipmentIds([]); setSelectedStaff([]); setEquipmentSearch(''); setStaffSearch(''); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Event</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Create a new event for a client.</DialogDescription>
            </DialogHeader>
            <EventForm onSubmit={() => createMutation.mutate(buildPayload())} isPending={createMutation.isPending} label="Create Event" />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{statsData?.totalEvents || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{statsData?.thisMonth || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{statsData?.upcoming || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{statsData?.byStatus?.find((s: { status: string }) => s.status === 'CONFIRMED')?.count || 0}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search events by name or venue..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(EventStatus).map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Events ({eventsData?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
          ) : !eventsData?.items?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found. Create your first event to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment / Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData.items.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Link href={`/events/${event.id}`} className="font-medium hover:underline">{event.name}</Link>
                      <p className="text-xs text-muted-foreground">{event.eventType}</p>
                    </TableCell>
                    <TableCell>{event.client ? <Link href={`/clients/${event.clientId}`} className="hover:underline">{event.client.name}</Link> : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{event.venue}</span></div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(event.startDate), 'MMM dd, yyyy')}</div>
                        <div className="text-muted-foreground">{format(new Date(event.startDate), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span>{event._count?.equipmentBookings || 0} items</span>
                        <span className="text-muted-foreground"> / {event._count?.staffAssignments || 0} staff</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[event.status]} text-white`}>{event.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">•••</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/events/${event.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(event)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {event.status === 'DRAFT' && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: event.id, status: 'CONFIRMED' })}>Confirm Event</DropdownMenuItem>}
                          {event.status === 'CONFIRMED' && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: event.id, status: 'IN_PROGRESS' })}>Start Event</DropdownMenuItem>}
                          {event.status === 'IN_PROGRESS' && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: event.id, status: 'COMPLETED' })}>Complete Event</DropdownMenuItem>}
                          {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { setCancelEventId(event.id); setIsDeleteOpen(true); }}>Cancel Event</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details</DialogDescription>
          </DialogHeader>
          <EventForm onSubmit={() => selectedEvent && updateMutation.mutate({ id: selectedEvent.id, data: buildPayload() })} isPending={updateMutation.isPending} label="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Cancel Event Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event? This will mark the event as cancelled and cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Keep Event</Button>
            <Button variant="destructive" disabled={statusMutation.isPending} onClick={() => { if (cancelEventId) { statusMutation.mutate({ id: cancelEventId, status: 'CANCELLED' }); setIsDeleteOpen(false); } }}>
              {statusMutation.isPending ? 'Cancelling...' : 'Cancel Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
