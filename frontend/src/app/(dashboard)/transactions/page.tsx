'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Event,
  EventStatus,
  EquipmentItem,
  EventEquipmentBooking,
  BookingStatus,
  ItemCondition,
  CheckOutTransaction,
  CheckInTransaction,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  History,
  Truck,
  Eye,
  Search,
} from 'lucide-react';

// ==================== Types ====================

interface PendingEvent {
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  items: (EquipmentItem & { category?: { id: string; name: string } })[];
}

interface OverdueItem {
  id: string;
  eventId: string;
  equipmentId: string;
  equipment: EquipmentItem & { category?: { id: string; name: string } };
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  daysOverdue: number;
  quantity: number;
  status: BookingStatus;
}

interface EventTransactions {
  event: { id: string; name: string; status: string };
  checkOuts: CheckOutTransaction[];
  checkIns: CheckInTransaction[];
  summary: {
    totalBooked: number;
    checkedOut: number;
    checkedIn: number;
  };
}

interface CheckOutItemForm {
  equipmentId: string;
  equipmentName: string;
  categoryName?: string;
  quantity: number;
  condition: string;
  notes: string;
  selected: boolean;
}

interface CheckInItemForm {
  equipmentId: string;
  equipmentName: string;
  categoryName?: string;
  quantity: number;
  returnedQuantity: number;
  condition: ItemCondition;
  damageNotes: string;
  selected: boolean;
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [viewEventId, setViewEventId] = useState('');
  const [checkOutItems, setCheckOutItems] = useState<CheckOutItemForm[]>([]);
  const [checkInItems, setCheckInItems] = useState<CheckInItemForm[]>([]);
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ==================== Queries ====================

  // Fetch events that can be checked out (CONFIRMED or IN_PROGRESS)
  const { data: eventsData } = useQuery({
    queryKey: ['events', 'for-checkout'],
    queryFn: async () => {
      const res = await api.get('/events', { params: { take: 100 } });
      return res.data;
    },
  });

  const confirmedEvents: Event[] = (eventsData?.items || []).filter(
    (e: Event) => e.status === EventStatus.CONFIRMED || e.status === EventStatus.IN_PROGRESS
  );

  // Fetch pending check-ins
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['transactions', 'pending'],
    queryFn: async () => {
      const res = await api.get('/transactions/pending');
      return res.data;
    },
  });

  // Fetch overdue check-ins
  const { data: overdueData, isLoading: loadingOverdue } = useQuery({
    queryKey: ['transactions', 'overdue'],
    queryFn: async () => {
      const res = await api.get('/transactions/overdue');
      return res.data;
    },
  });

  // Fetch event transactions when viewing
  const { data: eventTransactions, isLoading: loadingEventTx } = useQuery({
    queryKey: ['transactions', 'event', viewEventId],
    queryFn: async () => {
      const res = await api.get(`/transactions/event/${viewEventId}`);
      return res.data as EventTransactions;
    },
    enabled: !!viewEventId,
  });

  // ==================== Mutations ====================

  const checkOutMutation = useMutation({
    mutationFn: async (data: { eventId: string; items: any[]; notes?: string }) => {
      const res = await api.post('/transactions/check-out', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully checked out ${data.totalItems} items`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      resetCheckOutForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to check out equipment');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: { eventId: string; items: any[]; notes?: string }) => {
      const res = await api.post('/transactions/check-in', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Checked in ${data.totalItems} items${data.itemsWithIssues > 0 ? ` (${data.itemsWithIssues} with issues)` : ''}`
      );
      if (data.allReturned) {
        toast.info('All equipment returned - event marked as completed');
      }
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      resetCheckInForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to check in equipment');
    },
  });

  // ==================== Handlers ====================

  const resetCheckOutForm = () => {
    setCheckOutDialogOpen(false);
    setSelectedEventId('');
    setCheckOutItems([]);
    setCheckOutNotes('');
  };

  const resetCheckInForm = () => {
    setCheckInDialogOpen(false);
    setSelectedEventId('');
    setCheckInItems([]);
    setCheckInNotes('');
  };

  const handleSelectCheckOutEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    try {
      const res = await api.get(`/events/${eventId}`);
      const event = res.data;
      const bookings = (event.equipmentBookings || []).filter(
        (b: EventEquipmentBooking) =>
          b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED
      );
      setCheckOutItems(
        bookings.map((b: EventEquipmentBooking) => ({
          equipmentId: b.equipmentId,
          equipmentName: b.equipment?.name || 'Unknown',
          categoryName: b.equipment?.category?.name,
          quantity: b.quantity,
          condition: 'GOOD',
          notes: '',
          selected: true,
        }))
      );
    } catch {
      toast.error('Failed to load event equipment');
    }
  };

  const handleSelectCheckInEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    try {
      const res = await api.get(`/transactions/event/${eventId}`);
      const txData = res.data as EventTransactions;
      // Get all checked-out items that haven't been checked in yet
      const checkedOutEquipment = new Map<string, { name: string; category?: string; quantity: number }>();
      txData.checkOuts.forEach((co) => {
        co.items.forEach((item) => {
          const existing = checkedOutEquipment.get(item.equipmentId);
          const qty = (existing?.quantity || 0) + item.quantity;
          checkedOutEquipment.set(item.equipmentId, {
            name: item.equipment?.name || 'Unknown',
            category: item.equipment?.category?.name,
            quantity: qty,
          });
        });
      });
      // Subtract already checked-in items
      txData.checkIns.forEach((ci) => {
        ci.items.forEach((item) => {
          const existing = checkedOutEquipment.get(item.equipmentId);
          if (existing) {
            const remaining = existing.quantity - item.returnedQuantity;
            if (remaining <= 0) {
              checkedOutEquipment.delete(item.equipmentId);
            } else {
              checkedOutEquipment.set(item.equipmentId, { ...existing, quantity: remaining });
            }
          }
        });
      });

      if (checkedOutEquipment.size === 0) {
        toast.info('All equipment has already been checked in for this event');
        return;
      }

      setCheckInItems(
        Array.from(checkedOutEquipment.entries()).map(([equipmentId, data]) => ({
          equipmentId,
          equipmentName: data.name,
          categoryName: data.category,
          quantity: data.quantity,
          returnedQuantity: data.quantity,
          condition: ItemCondition.GOOD,
          damageNotes: '',
          selected: true,
        }))
      );
    } catch {
      toast.error('Failed to load event transactions');
    }
  };

  const handleCheckOut = () => {
    const selectedItems = checkOutItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.error('Select at least one item to check out');
      return;
    }
    checkOutMutation.mutate({
      eventId: selectedEventId,
      items: selectedItems.map((item) => ({
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        condition: item.condition,
        notes: item.notes || undefined,
      })),
      notes: checkOutNotes || undefined,
    });
  };

  const handleCheckIn = () => {
    const selectedItems = checkInItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.error('Select at least one item to check in');
      return;
    }
    checkInMutation.mutate({
      eventId: selectedEventId,
      items: selectedItems.map((item) => ({
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        returnedQuantity: item.returnedQuantity,
        condition: item.condition,
        damageNotes: item.damageNotes || undefined,
      })),
      notes: checkInNotes || undefined,
    });
  };

  const handleViewEvent = (eventId: string) => {
    setViewEventId(eventId);
    setViewDialogOpen(true);
  };

  const handleStartCheckIn = (eventId: string) => {
    handleSelectCheckInEvent(eventId);
    setCheckInDialogOpen(true);
  };

  // ==================== Computed ====================

  const pendingEvents: PendingEvent[] = pendingData?.byEvent || [];
  const totalPending = pendingData?.totalPending || 0;
  const overdueItems: OverdueItem[] = overdueData?.items || [];
  const totalOverdue = overdueData?.totalOverdue || 0;

  const filteredPending = pendingEvents.filter((pe) =>
    pe.event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOverdue = overdueItems.filter(
    (item) =>
      item.event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.equipment?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== Condition badge helper ====================

  const conditionBadge = (condition: string) => {
    switch (condition) {
      case 'GOOD':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Good</Badge>;
      case 'FAIR':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Fair</Badge>;
      case 'DAMAGED':
        return <Badge variant="destructive">Damaged</Badge>;
      case 'LOST':
        return <Badge variant="destructive" className="bg-red-800">Lost</Badge>;
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Equipment check-out and check-in for events
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCheckOutDialogOpen(true)}>
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Check Out
          </Button>
          <Button variant="outline" onClick={() => setCheckInDialogOpen(true)}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Check In
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Check-Out</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedEvents.length}</div>
            <p className="text-xs text-muted-foreground">Confirmed events awaiting equipment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Items out, awaiting return</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOverdue}</div>
            <p className="text-xs text-muted-foreground">Past event end date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(eventsData?.items || []).filter((e: Event) => e.status === EventStatus.IN_PROGRESS).length}
            </div>
            <p className="text-xs text-muted-foreground">Events in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Returns
              {totalPending > 0 && (
                <Badge variant="secondary" className="ml-2">{totalPending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue
              {totalOverdue > 0 && (
                <Badge variant="destructive" className="ml-2">{totalOverdue}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events or equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Overview Tab - Events ready for check-out */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Events Ready for Check-Out</CardTitle>
              <CardDescription>
                Confirmed events with booked equipment that can be dispatched
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No events ready for check-out</p>
                  <p className="text-sm mt-1">Events must be confirmed and have booked equipment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedEvents
                      .filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={event.status === EventStatus.CONFIRMED ? 'default' : 'secondary'}
                            >
                              {event.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(event.startDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(event.startDate), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event._count?.equipmentBookings || 0} items</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewEvent(event.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleSelectCheckOutEvent(event.id);
                                  setCheckOutDialogOpen(true);
                                }}
                              >
                                <ArrowUpFromLine className="h-4 w-4 mr-1" />
                                Check Out
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* In-Progress Events */}
          <Card>
            <CardHeader>
              <CardTitle>In-Progress Events</CardTitle>
              <CardDescription>Events with equipment currently checked out</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEvents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-10 w-10 mb-3 opacity-50" />
                  <p>No equipment currently out</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Items Out</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEvents.map((pe) => (
                      <TableRow key={pe.event.id}>
                        <TableCell className="font-medium">{pe.event.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(pe.event.startDate), 'MMM dd')} -{' '}
                            {format(new Date(pe.event.endDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{pe.items.length} items</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEvent(pe.event.id)}
                            >
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartCheckIn(pe.event.id)}
                            >
                              <ArrowDownToLine className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Returns Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Equipment Returns</CardTitle>
              <CardDescription>
                Equipment checked out that needs to be returned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No pending returns</p>
                  <p className="text-sm mt-1">All equipment has been returned</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPending.map((pe) => (
                    <div key={pe.event.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{pe.event.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pe.event.startDate), 'MMM dd')} -{' '}
                            {format(new Date(pe.event.endDate), 'MMM dd, yyyy')}
                          </p>
                          {new Date(pe.event.endDate) < new Date() && (
                            <Badge variant="destructive" className="mt-1">
                              Overdue by {formatDistanceToNow(new Date(pe.event.endDate))}
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleStartCheckIn(pe.event.id)}>
                          <ArrowDownToLine className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Equipment</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pe.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.category?.name || '-'}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                  Checked Out
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overdue Returns
              </CardTitle>
              <CardDescription>
                Equipment that should have been returned after event ended
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOverdue ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredOverdue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-4 text-green-500" />
                  <p className="font-medium">No overdue returns</p>
                  <p className="text-sm mt-1">All equipment returned on time</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Event Ended</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOverdue.map((item) => (
                      <TableRow key={item.id} className="bg-red-50/50">
                        <TableCell className="font-medium">{item.equipment?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.equipment?.category?.name || '-'}</Badge>
                        </TableCell>
                        <TableCell>{item.event.name}</TableCell>
                        <TableCell>
                          {format(new Date(item.event.endDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {item.daysOverdue} day{item.daysOverdue !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStartCheckIn(item.event.id)}
                          >
                            <ArrowDownToLine className="h-4 w-4 mr-1" />
                            Check In Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== CHECK-OUT DIALOG ==================== */}
      <Dialog open={checkOutDialogOpen} onOpenChange={(open) => { if (!open) resetCheckOutForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5" />
              Check Out Equipment
            </DialogTitle>
            <DialogDescription>
              Select an event and confirm the equipment to dispatch
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Selection */}
            <div className="space-y-2">
              <Label>Select Event</Label>
              <Select value={selectedEventId} onValueChange={handleSelectCheckOutEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {confirmedEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <span className="font-medium">{event.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({format(new Date(event.startDate), 'MMM dd')})
                      </span>
                    </SelectItem>
                  ))}
                  {confirmedEvents.length === 0 && (
                    <SelectItem value="none" disabled>
                      No events available for check-out
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Items */}
            {checkOutItems.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-base">Equipment to Check Out</Label>
                    <div className="text-sm text-muted-foreground">
                      {checkOutItems.filter((i) => i.selected).length} of {checkOutItems.length} selected
                    </div>
                  </div>
                  <div className="space-y-3">
                    {checkOutItems.map((item, idx) => (
                      <div
                        key={item.equipmentId}
                        className={`border rounded-lg p-4 transition-colors ${
                          item.selected ? 'border-primary bg-primary/5' : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const updated = [...checkOutItems];
                              updated[idx].selected = e.target.checked;
                              setCheckOutItems(updated);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.equipmentName}</p>
                                {item.categoryName && (
                                  <p className="text-sm text-muted-foreground">{item.categoryName}</p>
                                )}
                              </div>
                              <Badge variant="outline">Qty: {item.quantity}</Badge>
                            </div>
                            {item.selected && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Condition</Label>
                                  <Select
                                    value={item.condition}
                                    onValueChange={(v) => {
                                      const updated = [...checkOutItems];
                                      updated[idx].condition = v;
                                      setCheckOutItems(updated);
                                    }}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GOOD">Good</SelectItem>
                                      <SelectItem value="FAIR">Fair</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Notes</Label>
                                  <Input
                                    className="h-8"
                                    placeholder="Optional note..."
                                    value={item.notes}
                                    onChange={(e) => {
                                      const updated = [...checkOutItems];
                                      updated[idx].notes = e.target.value;
                                      setCheckOutItems(updated);
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>General Notes</Label>
                  <Textarea
                    placeholder="Any notes about this check-out..."
                    value={checkOutNotes}
                    onChange={(e) => setCheckOutNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            {selectedEventId && checkOutItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p>No equipment available for check-out</p>
                <p className="text-sm mt-1">Equipment may already be checked out or not yet booked</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCheckOutForm}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={
                !selectedEventId ||
                checkOutItems.filter((i) => i.selected).length === 0 ||
                checkOutMutation.isPending
              }
            >
              {checkOutMutation.isPending ? 'Processing...' : 'Confirm Check-Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== CHECK-IN DIALOG ==================== */}
      <Dialog open={checkInDialogOpen} onOpenChange={(open) => { if (!open) resetCheckInForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Check In Equipment
            </DialogTitle>
            <DialogDescription>
              Inspect and record the condition of returning equipment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Selection */}
            {checkInItems.length === 0 && (
              <div className="space-y-2">
                <Label>Select Event</Label>
                <Select value={selectedEventId} onValueChange={handleSelectCheckInEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event with checked-out equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingEvents.map((pe) => (
                      <SelectItem key={pe.event.id} value={pe.event.id}>
                        <span className="font-medium">{pe.event.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({pe.items.length} items)
                        </span>
                      </SelectItem>
                    ))}
                    {pendingEvents.length === 0 && (
                      <SelectItem value="none" disabled>
                        No events with checked-out equipment
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Equipment Items for Check-In */}
            {checkInItems.length > 0 && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">
                    Carefully inspect each item and record its condition. Damaged items will
                    automatically create a maintenance ticket.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-base">Returning Equipment</Label>
                    <div className="text-sm text-muted-foreground">
                      {checkInItems.filter((i) => i.selected).length} of {checkInItems.length} selected
                    </div>
                  </div>
                  <div className="space-y-3">
                    {checkInItems.map((item, idx) => (
                      <div
                        key={item.equipmentId}
                        className={`border rounded-lg p-4 transition-colors ${
                          item.selected
                            ? item.condition === ItemCondition.DAMAGED || item.condition === ItemCondition.LOST
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-primary bg-primary/5'
                            : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const updated = [...checkInItems];
                              updated[idx].selected = e.target.checked;
                              setCheckInItems(updated);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.equipmentName}</p>
                                {item.categoryName && (
                                  <p className="text-sm text-muted-foreground">{item.categoryName}</p>
                                )}
                              </div>
                              <Badge variant="outline">Qty: {item.quantity}</Badge>
                            </div>
                            {item.selected && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Condition *</Label>
                                    <Select
                                      value={item.condition}
                                      onValueChange={(v) => {
                                        const updated = [...checkInItems];
                                        updated[idx].condition = v as ItemCondition;
                                        setCheckInItems(updated);
                                      }}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="GOOD">
                                          <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            Good
                                          </span>
                                        </SelectItem>
                                        <SelectItem value="FAIR">
                                          <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                            Fair
                                          </span>
                                        </SelectItem>
                                        <SelectItem value="DAMAGED">
                                          <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            Damaged
                                          </span>
                                        </SelectItem>
                                        <SelectItem value="LOST">
                                          <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-800" />
                                            Lost
                                          </span>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Qty Returned</Label>
                                    <Input
                                      type="number"
                                      className="h-8"
                                      min={0}
                                      max={item.quantity}
                                      value={item.returnedQuantity}
                                      onChange={(e) => {
                                        const updated = [...checkInItems];
                                        updated[idx].returnedQuantity = parseInt(e.target.value) || 0;
                                        setCheckInItems(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                                {(item.condition === ItemCondition.DAMAGED ||
                                  item.condition === ItemCondition.LOST) && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-red-600">
                                      Damage/Loss Notes *
                                    </Label>
                                    <Textarea
                                      placeholder="Describe the damage or circumstances of loss..."
                                      className="border-red-300"
                                      rows={2}
                                      value={item.damageNotes}
                                      onChange={(e) => {
                                        const updated = [...checkInItems];
                                        updated[idx].damageNotes = e.target.value;
                                        setCheckInItems(updated);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {checkInItems.some(
                  (i) =>
                    i.selected &&
                    (i.condition === ItemCondition.DAMAGED || i.condition === ItemCondition.LOST)
                ) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800 mb-1">Issues Detected</p>
                    <ul className="text-sm text-red-700">
                      {checkInItems
                        .filter(
                          (i) =>
                            i.selected &&
                            (i.condition === ItemCondition.DAMAGED ||
                              i.condition === ItemCondition.LOST)
                        )
                        .map((item) => (
                          <li key={item.equipmentId}>
                            {item.equipmentName}: {item.condition}
                            {item.condition === ItemCondition.DAMAGED &&
                              ' — Maintenance ticket will be created'}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>General Notes</Label>
                  <Textarea
                    placeholder="Any notes about this check-in..."
                    value={checkInNotes}
                    onChange={(e) => setCheckInNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCheckInForm}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={
                checkInItems.filter((i) => i.selected).length === 0 ||
                checkInMutation.isPending
              }
            >
              {checkInMutation.isPending ? 'Processing...' : 'Confirm Check-In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW EVENT TRANSACTIONS DIALOG ==================== */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Event Transaction History
            </DialogTitle>
            {eventTransactions && (
              <DialogDescription>
                {eventTransactions.event.name} — Status: {eventTransactions.event.status}
              </DialogDescription>
            )}
          </DialogHeader>

          {loadingEventTx ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : eventTransactions ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{eventTransactions.summary.totalBooked}</p>
                      <p className="text-xs text-muted-foreground">Total Booked</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {eventTransactions.summary.checkedOut}
                      </p>
                      <p className="text-xs text-muted-foreground">Checked Out</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {eventTransactions.summary.checkedIn}
                      </p>
                      <p className="text-xs text-muted-foreground">Checked In</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Check-Outs */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowUpFromLine className="h-4 w-4" />
                  Check-Outs ({eventTransactions.checkOuts.length})
                </h3>
                {eventTransactions.checkOuts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-outs recorded</p>
                ) : (
                  <div className="space-y-3">
                    {eventTransactions.checkOuts.map((co) => (
                      <div key={co.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium">
                            By: {co.checkedOutByUser?.firstName} {co.checkedOutByUser?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(co.checkedOutAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        {co.notes && (
                          <p className="text-sm text-muted-foreground mb-2">Notes: {co.notes}</p>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipment</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Condition</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {co.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.equipment?.name}
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{conditionBadge(item.condition || 'GOOD')}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {item.notes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Check-Ins */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowDownToLine className="h-4 w-4" />
                  Check-Ins ({eventTransactions.checkIns.length})
                </h3>
                {eventTransactions.checkIns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-ins recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {eventTransactions.checkIns.map((ci) => (
                      <div key={ci.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium">
                            By: {ci.checkedInByUser?.firstName} {ci.checkedInByUser?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ci.checkedInAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        {ci.notes && (
                          <p className="text-sm text-muted-foreground mb-2">Notes: {ci.notes}</p>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipment</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Returned</TableHead>
                              <TableHead>Condition</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ci.items.map((item) => (
                              <TableRow
                                key={item.id}
                                className={
                                  item.condition === ItemCondition.DAMAGED ||
                                  item.condition === ItemCondition.LOST
                                    ? 'bg-red-50/50'
                                    : ''
                                }
                              >
                                <TableCell className="font-medium">
                                  {item.equipment?.name}
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  {item.returnedQuantity}
                                  {item.isShortage && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      Shortage
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{conditionBadge(item.condition)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {item.damageNotes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
