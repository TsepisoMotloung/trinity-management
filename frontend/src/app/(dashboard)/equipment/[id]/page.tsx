'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Clock, Wrench, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { EquipmentStatus } from '@/types';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-600',
  RESERVED: 'bg-blue-600',
  IN_USE: 'bg-purple-600',
  DAMAGED: 'bg-red-600',
  UNDER_REPAIR: 'bg-yellow-600',
  LOST: 'bg-gray-600',
  RETIRED: 'bg-gray-400',
};

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: item, isLoading } = useQuery({
    queryKey: ['equipment-item', id],
    queryFn: async () => {
      const res = await api.get(`/equipment/items/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Equipment not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/equipment"><ArrowLeft className="mr-2 h-4 w-4" />Back to Equipment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/equipment"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <p className="text-muted-foreground">{item.category?.name}</p>
        </div>
        <Badge className={`${statusColors[item.currentStatus] || 'bg-gray-500'} text-white text-sm px-3 py-1`}>
          {item.currentStatus.replace('_', ' ')}
        </Badge>
      </div>

      {/* Quantity Breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{item.quantity} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{item.quantityAvailable ?? item.quantity}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{item.quantityReserved ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{item.quantityInUse ?? 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Damaged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{item.quantityDamaged ?? 0}</div></CardContent></Card>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Equipment Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{item.category?.name || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Serial Number</span><span className="font-mono">{item.serialNumber || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Barcode</span><span className="font-mono">{item.barcode || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span>{item.quantity} {item.unit}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Purchase Date</span><span>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Purchase Price</span><span>{item.purchasePrice ? `R ${Number(item.purchasePrice).toFixed(2)}` : '-'}</span></div>
            {item.description && (
              <>
                <Separator />
                <div><span className="text-muted-foreground">Description</span><p className="mt-1">{item.description}</p></div>
              </>
            )}
            {item.notes && (
              <>
                <Separator />
                <div><span className="text-muted-foreground">Notes</span><p className="mt-1">{item.notes}</p></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-muted-foreground">Added</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Status History</TabsTrigger>
          <TabsTrigger value="bookings">Event Bookings</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
            <CardContent>
              {item.statusHistory?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.statusHistory.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-sm">{new Date(h.createdAt).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{h.previousStatus?.replace('_', ' ') || '-'}</Badge></TableCell>
                        <TableCell><Badge className={`${statusColors[h.newStatus] || 'bg-gray-500'} text-white`}>{h.newStatus.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{h.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No status history</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Event Bookings</CardTitle></CardHeader>
            <CardContent>
              {item.bookings?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reserved Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.bookings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link href={`/events/${b.event?.id || b.eventId}`} className="font-medium hover:underline">{b.event?.name || '-'}</Link>
                        </TableCell>
                        <TableCell className="font-medium">{b.quantity}</TableCell>
                        <TableCell className="text-sm">
                          {b.reservedFrom
                            ? `${new Date(b.reservedFrom).toLocaleDateString()} - ${new Date(b.reservedUntil).toLocaleDateString()}`
                            : b.event?.startDate
                              ? `${new Date(b.event.startDate).toLocaleDateString()} - ${new Date(b.event.endDate).toLocaleDateString()}`
                              : '-'}
                        </TableCell>
                        <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No bookings yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Maintenance Tickets</CardTitle></CardHeader>
            <CardContent>
              {item.maintenanceTickets?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.maintenanceTickets.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                        <TableCell className="text-sm">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No maintenance tickets</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
