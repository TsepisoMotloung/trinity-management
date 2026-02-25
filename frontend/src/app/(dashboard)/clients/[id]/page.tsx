'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Mail, Phone, MapPin, DollarSign, FileText, CreditCard, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500', QUOTED: 'bg-blue-500', CONFIRMED: 'bg-green-600',
  IN_PROGRESS: 'bg-purple-600', COMPLETED: 'bg-emerald-600', CANCELLED: 'bg-red-600',
  SENT: 'bg-blue-500', ACCEPTED: 'bg-green-600', REJECTED: 'bg-red-600',
  PAID: 'bg-emerald-600', PARTIALLY_PAID: 'bg-amber-600', OVERDUE: 'bg-red-600',
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`);
      return res.data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ['client-history', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}/history`);
      return res.data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;
  if (!client) return <div className="text-center py-16"><p className="text-muted-foreground">Client not found</p><Button asChild variant="outline" className="mt-4"><Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button></div>;

  const summary = history?.financialSummary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm"><Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.contactPerson || 'No contact person'}</p>
        </div>
        <Badge variant={client.isActive ? 'default' : 'secondary'} className="text-sm px-3 py-1">{client.isActive ? 'Active' : 'Inactive'}</Badge>
        <Button asChild size="sm"><Link href={`/events?createForClient=${id}`}><Plus className="mr-2 h-4 w-4" />New Event</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href={`/quotes?createForClient=${id}`}><FileText className="mr-2 h-4 w-4" />New Quote</Link></Button>
      </div>

      {/* Info & Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {client.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{client.phone}</span></div>}
            {client.alternatePhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{client.alternatePhone}</span></div>}
            {client.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{client.email}</span></div>}
            {(client.city || client.address) && (
              <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><span>{[client.address, client.city].filter(Boolean).join(', ')}</span></div>
            )}
            {client.notes && <><Separator /><div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm mt-1">{client.notes}</p></div></>}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>Created: {format(new Date(client.createdAt), 'MMM dd, yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid gap-4 grid-cols-2 md:grid-cols-4 content-start">
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Events</p><p className="text-2xl font-bold">{history?.events?.length || client._count?.events || 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Total Invoiced</p><p className="text-2xl font-bold">M {Number(summary?.totalInvoiced || 0).toFixed(0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Total Paid</p><p className="text-2xl font-bold text-green-600">M {Number(summary?.totalPaid || 0).toFixed(0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-2xl font-bold text-red-600">M {Number(summary?.outstanding || 0).toFixed(0)}</p></CardContent></Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events ({history?.events?.length || 0})</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({history?.quotes?.length || 0})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({history?.invoices?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({history?.payments?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Event History</CardTitle></CardHeader>
            <CardContent>
              {history?.events?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.events.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell><Link href={`/events/${e.id}`} className="font-medium hover:underline">{e.name}</Link></TableCell>
                        <TableCell>{e.eventType}</TableCell>
                        <TableCell>{format(new Date(e.startDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{e.venue}</TableCell>
                        <TableCell><Badge className={`${statusColors[e.status] || 'bg-gray-500'} text-white`}>{e.status.replace('_', ' ')}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No events yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Quotes</CardTitle></CardHeader>
            <CardContent>
              {history?.quotes?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.quotes.map((q: any) => (
                      <TableRow key={q.id}>
                        <TableCell><Link href="/quotes" className="font-mono hover:underline">{q.quoteNumber}</Link></TableCell>
                        <TableCell>{q.event ? <Link href={`/events/${q.event.id}`} className="hover:underline">{q.event.name}</Link> : '-'}</TableCell>
                        <TableCell>{format(new Date(q.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">M {Number(q.total).toFixed(2)}</TableCell>
                        <TableCell><Badge className={`${statusColors[q.status] || 'bg-gray-500'} text-white`}>{q.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No quotes yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Invoices</CardTitle></CardHeader>
            <CardContent>
              {history?.invoices?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell><Link href="/invoices" className="font-mono hover:underline">{inv.invoiceNumber}</Link></TableCell>
                        <TableCell>{format(new Date(inv.issueDate || inv.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{inv.dueDate ? format(new Date(inv.dueDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell className="font-medium">M {Number(inv.total).toFixed(2)}</TableCell>
                        <TableCell><Badge className={`${statusColors[inv.status] || 'bg-gray-500'} text-white`}>{inv.status.replace('_', ' ')}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No invoices yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payments</CardTitle></CardHeader>
            <CardContent>
              {history?.payments?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.paymentDate || p.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-mono text-sm">{p.invoice?.invoiceNumber || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{p.method?.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="text-sm">{p.reference || '-'}</TableCell>
                        <TableCell className="font-medium text-green-600">M {Number(p.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No payments recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
