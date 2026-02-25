'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Package, Users, Plus, Trash2, CheckCircle, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import api, { getErrorMessage } from '@/lib/api';
import { EquipmentItem, User, EventStatus } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500', QUOTED: 'bg-blue-500', CONFIRMED: 'bg-green-600',
  IN_PROGRESS: 'bg-purple-600', COMPLETED: 'bg-emerald-600', CANCELLED: 'bg-red-600',
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ type: 'booking' | 'staff'; id: string; name: string } | null>(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [bookNotes, setBookNotes] = useState('');
  const [staffForm, setStaffForm] = useState({ userId: '', role: '', notes: '' });
  const [equipSearch, setEquipSearch] = useState('');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await api.get(`/events/${id}`);
      return res.data;
    },
  });

  // Fetch available equipment for the event's date range
  const { data: availableEquipment } = useQuery({
    queryKey: ['available-equipment', event?.startDate, event?.endDate, id],
    queryFn: async () => {
      if (!event?.startDate || !event?.endDate) return [];
      const params = new URLSearchParams({
        startDate: event.startDate,
        endDate: event.endDate,
        excludeEventId: id,
      });
      const res = await api.get<EquipmentItem[]>(`/equipment/available?${params}`);
      return res.data;
    },
    enabled: isBookOpen && !!event?.startDate && !!event?.endDate,
  });

  // Fetch available staff for the event's date range
  const { data: availableStaff } = useQuery({
    queryKey: ['available-staff', event?.startDate, event?.endDate, id],
    queryFn: async () => {
      if (!event?.startDate || !event?.endDate) return [];
      const params = new URLSearchParams({
        startDate: event.startDate,
        endDate: event.endDate,
        excludeEventId: id,
      });
      const res = await api.get<User[]>(`/events/available-staff?${params}`);
      return res.data;
    },
    enabled: isStaffOpen && !!event?.startDate && !!event?.endDate,
  });

  const bookMutation = useMutation({
    mutationFn: async (data: { equipmentId: string; notes?: string }) => {
      const res = await api.post(`/events/${id}/equipment`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const bookMultipleMutation = useMutation({
    mutationFn: async (equipmentIds: string[]) => {
      // Book each item individually
      const results = await Promise.allSettled(
        equipmentIds.map((equipmentId) =>
          api.post(`/events/${id}/equipment`, { equipmentId, notes: bookNotes || undefined })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} item(s) failed to book`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] });
      setIsBookOpen(false);
      setSelectedEquipmentIds([]);
      setBookNotes('');
      toast.success('Equipment booked successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const removeBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await api.delete(`/events/${id}/equipment/${bookingId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Booking removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const confirmBookingsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/events/${id}/equipment/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Bookings confirmed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignStaffMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string; notes?: string }) => {
      const res = await api.post(`/events/${id}/staff`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['available-staff'] });
      setIsStaffOpen(false);
      setStaffForm({ userId: '', role: '', notes: '' });
      toast.success('Staff assigned');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.delete(`/events/${id}/staff/${assignmentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Staff removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await api.patch(`/events/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;
  if (!event) return <div className="text-center py-16"><p className="text-muted-foreground">Event not found</p><Button asChild variant="outline" className="mt-4"><Link href="/events"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button></div>;

  const pendingBookings = event.equipmentBookings?.filter((b: any) => b.status === 'PENDING').length || 0;
  const staffRoles = ['Sound Engineer', 'DJ', 'Lighting Technician', 'Stage Manager', 'Setup Crew', 'Driver', 'Assistant'];

  const filteredEquipment = (availableEquipment || []).filter((e: EquipmentItem) =>
    !equipSearch || e.name.toLowerCase().includes(equipSearch.toLowerCase()) ||
    e.category?.name?.toLowerCase().includes(equipSearch.toLowerCase()) ||
    e.serialNumber?.toLowerCase().includes(equipSearch.toLowerCase())
  );

  const toggleEquipment = (equipId: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(equipId) ? prev.filter((id) => id !== equipId) : [...prev, equipId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm"><Link href="/events"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{event.eventType} • {event.client?.name}</p>
          {event.originQuote && (
            <p className="text-xs text-muted-foreground mt-1">
              From Quote: <Link href="/quotes" className="hover:underline font-mono">{event.originQuote.quoteNumber}</Link>
            </p>
          )}
        </div>
        <Badge className={`${statusColors[event.status] || 'bg-gray-500'} text-white text-sm px-3 py-1`}>{event.status.replace('_', ' ')}</Badge>
      </div>

      {/* Status Actions */}
      <div className="flex gap-2">
        {event.status === 'DRAFT' && <Button onClick={() => statusMutation.mutate('CONFIRMED')} disabled={statusMutation.isPending}><CheckCircle className="mr-2 h-4 w-4" />Confirm Event</Button>}
        {event.status === 'CONFIRMED' && <Button onClick={() => statusMutation.mutate('IN_PROGRESS')} disabled={statusMutation.isPending}>Start Event</Button>}
        {event.status === 'IN_PROGRESS' && <Button onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending}>Complete Event</Button>}
        {!['COMPLETED', 'CANCELLED'].includes(event.status) && <Button variant="destructive" onClick={() => setIsCancelOpen(true)} disabled={statusMutation.isPending}>Cancel</Button>}
      </div>

      {/* Event Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{event.eventType}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{format(new Date(event.startDate), 'MMM dd, yyyy HH:mm')}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">End</span><span>{format(new Date(event.endDate), 'MMM dd, yyyy HH:mm')}</span></div>
            {event.setupTime && <><Separator /><div className="flex justify-between"><span className="text-muted-foreground">Setup</span><span>{format(new Date(event.setupTime), 'MMM dd, yyyy HH:mm')}</span></div></>}
            <Separator />
            <div className="flex justify-between items-start"><span className="text-muted-foreground">Venue</span><span className="text-right"><MapPin className="h-3 w-3 inline mr-1" />{event.venue}</span></div>
            {event.venueAddress && <><Separator /><div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right">{event.venueAddress}</span></div></>}
            {event.description && <><Separator /><div><span className="text-muted-foreground">Description</span><p className="mt-1 text-sm">{event.description}</p></div></>}
            {event.requirements && <><Separator /><div><span className="text-muted-foreground">Requirements</span><p className="mt-1 text-sm">{event.requirements}</p></div></>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><Link href={`/clients/${event.client?.id}`} className="font-medium hover:underline">{event.client?.name}</Link></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{event.client?.contactPerson || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{event.client?.phone || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{event.client?.email || '-'}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment">Equipment ({event.equipmentBookings?.length || 0})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({event.staffAssignments?.length || 0})</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Equipment Bookings</CardTitle>
              <div className="flex gap-2">
                {pendingBookings > 0 && (
                  <Button size="sm" variant="outline" onClick={() => confirmBookingsMutation.mutate()} disabled={confirmBookingsMutation.isPending}>
                    <CheckCircle className="mr-2 h-4 w-4" />Confirm All ({pendingBookings})
                  </Button>
                )}
                {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
                  <Button size="sm" onClick={() => { setIsBookOpen(true); setSelectedEquipmentIds([]); setEquipSearch(''); }}><Plus className="mr-2 h-4 w-4" />Add Equipment</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {event.equipmentBookings?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Serial #</TableHead>
                      <TableHead>Reserved Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.equipmentBookings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link href={`/equipment/${b.equipment?.id}`} className="font-medium hover:underline">{b.equipment?.name}</Link>
                        </TableCell>
                        <TableCell>{b.equipment?.category?.name || '-'}</TableCell>
                        <TableCell className="text-sm font-mono">{b.equipment?.serialNumber || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.reservedFrom ? `${format(new Date(b.reservedFrom), 'MMM dd HH:mm')} → ${format(new Date(b.reservedUntil), 'MMM dd HH:mm')}` : '-'}
                        </TableCell>
                        <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {b.status !== 'CHECKED_OUT' && b.status !== 'RETURNED' && (
                            <Button variant="ghost" size="sm" onClick={() => setRemoveConfirm({ type: 'booking', id: b.id, name: b.equipment?.name || 'this item' })} disabled={removeBookingMutation.isPending}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No equipment booked yet. Add equipment to this event.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Staff Assignments</CardTitle>
              {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
                <Button size="sm" onClick={() => setIsStaffOpen(true)}><Plus className="mr-2 h-4 w-4" />Assign Staff</Button>
              )}
            </CardHeader>
            <CardContent>
              {event.staffAssignments?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.staffAssignments.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.user?.firstName} {a.user?.lastName}</TableCell>
                        <TableCell><Badge variant="outline">{a.role}</Badge></TableCell>
                        <TableCell className="text-sm">{a.user?.phone || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setRemoveConfirm({ type: 'staff', id: a.id, name: `${a.user?.firstName} ${a.user?.lastName}` })} disabled={removeStaffMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No staff assigned. Assign team members to this event.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Quotes</CardTitle>
                {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/quotes?createForEvent=${id}&clientId=${event.clientId}`}><Plus className="mr-2 h-4 w-4" />Create Quote</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {event.quotes?.length ? (
                  <div className="space-y-2">
                    {event.quotes.map((q: any) => (
                      <Link key={q.id} href="/quotes" className="flex justify-between items-center p-3 rounded border hover:bg-accent transition-colors">
                        <div>
                          <span className="font-mono text-sm font-medium">{q.quoteNumber}</span>
                          <Badge variant="outline" className="ml-2">{q.status}</Badge>
                        </div>
                        <span className="font-medium">M {Number(q.total).toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">No quotes yet. Create one to get started.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Invoices</CardTitle>
                {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/invoices?createForEvent=${id}&clientId=${event.clientId}`}><Plus className="mr-2 h-4 w-4" />Create Invoice</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {event.invoices?.length ? (
                  <div className="space-y-2">
                    {event.invoices.map((inv: any) => (
                      <Link key={inv.id} href="/invoices" className="flex justify-between items-center p-3 rounded border hover:bg-accent transition-colors">
                        <div>
                          <span className="font-mono text-sm font-medium">{inv.invoiceNumber}</span>
                          <Badge variant="outline" className="ml-2">{inv.status}</Badge>
                        </div>
                        <span className="font-medium">M {Number(inv.total).toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">No invoices yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Book Equipment Dialog - Multi-select picker with availability */}
      <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>Select available equipment for this event&apos;s dates. Only items not booked elsewhere are shown.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Search equipment..."
              value={equipSearch}
              onChange={(e) => setEquipSearch(e.target.value)}
            />
            <div className="max-h-[300px] overflow-y-auto border rounded-md p-2 space-y-1">
              {filteredEquipment.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No available equipment for these dates.</p>
              ) : (
                filteredEquipment.map((e: EquipmentItem) => (
                  <label key={e.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={selectedEquipmentIds.includes(e.id)}
                      onCheckedChange={() => toggleEquipment(e.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.category?.name} {e.serialNumber ? `• ${e.serialNumber}` : ''}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedEquipmentIds.length > 0 && (
              <p className="text-sm text-muted-foreground">{selectedEquipmentIds.length} item(s) selected</p>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={bookNotes} onChange={(e) => setBookNotes(e.target.value)} placeholder="Optional notes for all bookings" />
            </div>
            <Button
              className="w-full"
              onClick={() => bookMultipleMutation.mutate(selectedEquipmentIds)}
              disabled={bookMultipleMutation.isPending || selectedEquipmentIds.length === 0}
            >
              {bookMultipleMutation.isPending ? 'Booking...' : `Book ${selectedEquipmentIds.length} Item(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog - Shows only available staff */}
      <Dialog open={isStaffOpen} onOpenChange={setIsStaffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
            <DialogDescription>Only staff available for this event&apos;s dates are shown.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Member *</Label>
              <Select value={staffForm.userId} onValueChange={(v) => setStaffForm({ ...staffForm, userId: v })}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {(availableStaff || []).map((u: User) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{staffRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={staffForm.notes} onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => assignStaffMutation.mutate({ userId: staffForm.userId, role: staffForm.role, notes: staffForm.notes || undefined })} disabled={assignStaffMutation.isPending || !staffForm.userId || !staffForm.role}>
              {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Event Confirmation */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this event? This action cannot be easily undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Keep Event</Button>
            <Button variant="destructive" disabled={statusMutation.isPending} onClick={() => { statusMutation.mutate('CANCELLED'); setIsCancelOpen(false); }}>
              {statusMutation.isPending ? 'Cancelling...' : 'Cancel Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Booking/Staff Confirmation */}
      <Dialog open={!!removeConfirm} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeConfirm?.type === 'booking' ? 'Equipment Booking' : 'Staff Assignment'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removeConfirm?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (removeConfirm?.type === 'booking') removeBookingMutation.mutate(removeConfirm.id);
              else if (removeConfirm?.type === 'staff') removeStaffMutation.mutate(removeConfirm.id);
              setRemoveConfirm(null);
            }}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
