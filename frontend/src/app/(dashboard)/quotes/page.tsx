'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, MoreHorizontal, Eye, Send, CheckCircle, XCircle, Trash2, Download, Receipt } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api, { getErrorMessage } from '@/lib/api';
import { Client, Event, PaginatedResponse, QuotesResponse } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500', SENT: 'bg-blue-500', ACCEPTED: 'bg-green-600', REJECTED: 'bg-red-500', EXPIRED: 'bg-gray-400',
};

interface LineItem { description: string; quantity: number; unitPrice: number; }

export default function QuotesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingQuote, setViewingQuote] = useState<any>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendQuoteId, setSendQuoteId] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [form, setForm] = useState({ clientId: '', eventId: '', validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'), discount: '0', taxRate: '15', notes: '', terms: '' });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['quotes', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await api.get<QuotesResponse>(`/finance/quotes?${params}`);
      return res.data;
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-select'],
    queryFn: async () => { const res = await api.get<PaginatedResponse<Client>>('/clients?take=200'); return res.data; },
    enabled: isCreateOpen,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events-select'],
    queryFn: async () => { const res = await api.get<PaginatedResponse<Event>>('/events?take=200'); return res.data; },
    enabled: isCreateOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        clientId: form.clientId,
        lineItems: lineItems.filter((li) => li.description && li.unitPrice > 0),
        validUntil: new Date(form.validUntil).toISOString(),
      };
      if (form.eventId) payload.eventId = form.eventId;
      if (Number(form.discount)) payload.discount = Number(form.discount);
      if (Number(form.taxRate)) payload.taxRate = Number(form.taxRate);
      if (form.notes) payload.notes = form.notes;
      if (form.terms) payload.terms = form.terms;
      const res = await api.post('/finance/quotes', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Quote created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/finance/quotes/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/finance/quotes/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote deleted');
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const sendMutation = useMutation({
    mutationFn: async ({ id, email, message }: { id: string; email?: string; message?: string }) => {
      const res = await api.post(`/finance/quotes/${id}/send`, { email, message });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsSendOpen(false);
      toast.success('Quote sent successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const invoiceFromQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post('/finance/invoices/from-quote', { quoteId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created from quote');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const downloadQuotePdf = async (id: string, quoteNumber: string) => {
    try {
      const res = await api.get(`/finance/quotes/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
  };

  const resetForm = () => {
    setForm({ clientId: '', eventId: '', validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'), discount: '0', taxRate: '15', notes: '', terms: '' });
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
  };

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'description') updated[idx].description = value as string;
    else updated[idx][field] = Number(value);
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const discount = Number(form.discount) || 0;
  const taxRate = Number(form.taxRate) || 0;
  const tax = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + tax;

  const viewQuote = async (id: string) => {
    try {
      const res = await api.get(`/finance/quotes/${id}`);
      setViewingQuote(res.data);
      setIsViewOpen(true);
    } catch { toast.error('Failed to load quote'); }
  };

  const quotes = quotesData?.quotes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Quotes</h1><p className="text-muted-foreground">Create and manage quotations</p></div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Quote</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{quotesData?.total || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Draft</p><p className="text-2xl font-bold">{quotes.filter((q: any) => q.status === 'DRAFT').length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Sent</p><p className="text-2xl font-bold">{quotes.filter((q: any) => q.status === 'SENT').length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Accepted</p><p className="text-2xl font-bold text-green-600">{quotes.filter((q: any) => q.status === 'ACCEPTED').length}</p></CardContent></Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search quotes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!quotes.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No quotes found.</TableCell></TableRow>
                ) : (
                  quotes.map((quote: any) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.client ? <Link href={`/clients/${quote.clientId}`} className="hover:underline">{quote.client.name}</Link> : '-'}</TableCell>
                      <TableCell>{quote.event ? <Link href={`/events/${quote.eventId}`} className="hover:underline">{quote.event.name}</Link> : '-'}</TableCell>
                      <TableCell className="font-medium">M {Number(quote.total).toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(quote.validUntil), 'dd MMM yyyy')}</TableCell>
                      <TableCell><Badge className={`${statusColors[quote.status] || 'bg-gray-500'} text-white`}>{quote.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewQuote(quote.id)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadQuotePdf(quote.id, quote.quoteNumber)}><Download className="mr-2 h-4 w-4" />Download PDF</DropdownMenuItem>
                            {quote.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => { setSendQuoteId(quote.id); setSendEmail(quote.client?.email || ''); setSendMessage(''); setIsSendOpen(true); }}>
                                <Send className="mr-2 h-4 w-4" />Send to Client
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'SENT' && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: quote.id, status: 'ACCEPTED' })}><CheckCircle className="mr-2 h-4 w-4" />Accept</DropdownMenuItem>}
                            {quote.status === 'SENT' && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: quote.id, status: 'REJECTED' })}><XCircle className="mr-2 h-4 w-4" />Reject</DropdownMenuItem>}
                            {quote.status === 'ACCEPTED' && (
                              <DropdownMenuItem onClick={() => invoiceFromQuoteMutation.mutate(quote.id)}>
                                <Receipt className="mr-2 h-4 w-4" />Create Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {quote.status === 'DRAFT' && <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteId(quote.id); setIsDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Quote Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Quote</DialogTitle><DialogDescription>Create a new quotation for a client.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clientsData?.items?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event (optional)</Label>
                <Select value={form.eventId || 'none'} onValueChange={(v) => setForm({ ...form, eventId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No event</SelectItem>
                    {eventsData?.items?.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Line Items *</Label><Button type="button" variant="outline" size="sm" onClick={addLineItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button></div>
              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input className="flex-1" placeholder="Description" value={li.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} />
                    <Input className="w-20" type="number" min="1" placeholder="Qty" value={li.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} />
                    <Input className="w-28" type="number" min="0" step="0.01" placeholder="Unit Price" value={li.unitPrice || ''} onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)} />
                    <span className="w-24 text-right pt-2 text-sm font-medium">R {(li.quantity * li.unitPrice).toFixed(2)}</span>
                    {lineItems.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(idx)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Valid Until *</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
              <div className="space-y-2"><Label>Discount (R)</Label><Input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" min="0" max="100" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
            </div>

            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Terms & Conditions</Label><Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} /></div>

            {/* Totals */}
            <div className="border rounded p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>R {subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>- R {discount.toFixed(2)}</span></div>}
              {taxRate > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>R {tax.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>R {total.toFixed(2)}</span></div>
            </div>

            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.clientId || !lineItems.some((li) => li.description && li.unitPrice > 0)}>
              {createMutation.isPending ? 'Creating...' : 'Create Quote'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Quote Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Quote {viewingQuote?.quoteNumber}</DialogTitle><DialogDescription>Quote details and line items.</DialogDescription></DialogHeader>
          {viewingQuote && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client:</span> {viewingQuote.client ? <Link href={`/clients/${viewingQuote.clientId}`} className="font-medium hover:underline">{viewingQuote.client.name}</Link> : '-'}</div>
                <div><span className="text-muted-foreground">Event:</span> {viewingQuote.event ? <Link href={`/events/${viewingQuote.eventId}`} className="font-medium hover:underline">{viewingQuote.event.name}</Link> : <span className="font-medium">-</span>}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={`${statusColors[viewingQuote.status]} text-white`}>{viewingQuote.status}</Badge></div>
                <div><span className="text-muted-foreground">Valid Until:</span> <span>{format(new Date(viewingQuote.validUntil), 'dd MMM yyyy')}</span></div>
                {viewingQuote.sentAt && <div><span className="text-muted-foreground">Sent:</span> <span>{format(new Date(viewingQuote.sentAt), 'dd MMM yyyy HH:mm')}</span></div>}
                {viewingQuote.sentToEmail && <div><span className="text-muted-foreground">Sent to:</span> <span>{viewingQuote.sentToEmail}</span></div>}
                {viewingQuote.acceptedAt && <div><span className="text-muted-foreground">Accepted:</span> <span className="text-green-600">{format(new Date(viewingQuote.acceptedAt), 'dd MMM yyyy HH:mm')}</span></div>}
                {viewingQuote.rejectedAt && <div><span className="text-muted-foreground">Rejected:</span> <span className="text-red-600">{format(new Date(viewingQuote.rejectedAt), 'dd MMM yyyy HH:mm')}</span></div>}
                {viewingQuote.rejectionReason && <div className="col-span-2"><span className="text-muted-foreground">Rejection Reason:</span> <span>{viewingQuote.rejectionReason}</span></div>}
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {viewingQuote.lineItems?.map((li: any) => (
                    <TableRow key={li.id}><TableCell>{li.description}</TableCell><TableCell>{li.quantity}</TableCell><TableCell>M {Number(li.unitPrice).toFixed(2)}</TableCell><TableCell className="text-right">R {(li.quantity * Number(li.unitPrice)).toFixed(2)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border rounded p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>M {Number(viewingQuote.subtotal).toFixed(2)}</span></div>
                {Number(viewingQuote.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>- R {Number(viewingQuote.discount).toFixed(2)}</span></div>}
                {Number(viewingQuote.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span>M {Number(viewingQuote.tax).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>M {Number(viewingQuote.total).toFixed(2)}</span></div>
              </div>
              {viewingQuote.notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{viewingQuote.notes}</p></div>}
              {viewingQuote.terms && <div><p className="text-sm text-muted-foreground">Terms</p><p className="text-sm">{viewingQuote.terms}</p></div>}
              {viewingQuote.invoices?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Linked Invoices</h3>
                  <div className="space-y-1">
                    {viewingQuote.invoices.map((inv: any) => (
                      <Link key={inv.id} href="/invoices" className="flex justify-between items-center p-2 rounded border text-sm hover:bg-accent transition-colors">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{inv.status}</Badge>
                          <span className="font-medium">M {Number(inv.total).toFixed(2)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => downloadQuotePdf(viewingQuote.id, viewingQuote.quoteNumber)}>
                  <Download className="mr-2 h-4 w-4" />Download PDF
                </Button>
                {viewingQuote.status === 'ACCEPTED' && !viewingQuote.invoices?.length && (
                  <Button className="flex-1" onClick={() => { invoiceFromQuoteMutation.mutate(viewingQuote.id); setIsViewOpen(false); }}>
                    <Receipt className="mr-2 h-4 w-4" />Create Invoice
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Quote Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send Quote</DialogTitle><DialogDescription>Send this quote to the client. They will receive a link to accept or reject it.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client Email</Label>
              <Input type="email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder="client@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} placeholder="Add a personal message..." rows={3} />
            </div>
            <Button className="w-full" onClick={() => sendMutation.mutate({ id: sendQuoteId, email: sendEmail || undefined, message: sendMessage || undefined })}
              disabled={sendMutation.isPending}>
              {sendMutation.isPending ? 'Sending...' : 'Send Quote'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
