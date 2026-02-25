'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, DollarSign, MoreHorizontal, Eye, Send, CreditCard, Trash2, Download, FileText } from 'lucide-react';
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
import { Client, Event, PaginatedResponse, InvoicesResponse, QuotesResponse } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500', SENT: 'bg-blue-500', PARTIALLY_PAID: 'bg-amber-600', PAID: 'bg-green-600', OVERDUE: 'bg-red-600', CANCELLED: 'bg-gray-400',
};

interface LineItem { description: string; quantity: number; unitPrice: number; }

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState('');
  const [form, setForm] = useState({ clientId: '', eventId: '', dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), discount: '0', taxRate: '15', notes: '', terms: '' });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'EFT' as string, referenceNumber: '', notes: '' });
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isFromQuoteOpen, setIsFromQuoteOpen] = useState(false);
  const [fromQuoteId, setFromQuoteId] = useState('');

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await api.get<InvoicesResponse>(`/finance/invoices?${params}`);
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

  const { data: acceptedQuotesData } = useQuery({
    queryKey: ['accepted-quotes'],
    queryFn: async () => { const res = await api.get<QuotesResponse>('/finance/quotes?status=ACCEPTED'); return res.data; },
    enabled: isFromQuoteOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        clientId: form.clientId,
        lineItems: lineItems.filter((li) => li.description && li.unitPrice > 0),
        dueDate: new Date(form.dueDate).toISOString(),
      };
      if (form.eventId) payload.eventId = form.eventId;
      if (Number(form.discount)) payload.discount = Number(form.discount);
      if (Number(form.taxRate)) payload.taxRate = Number(form.taxRate);
      if (form.notes) payload.notes = form.notes;
      if (form.terms) payload.terms = form.terms;
      const res = await api.post('/finance/invoices', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Invoice created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/finance/invoices/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        invoiceId: payingInvoiceId,
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod,
      };
      if (payForm.referenceNumber) payload.referenceNumber = payForm.referenceNumber;
      if (payForm.notes) payload.notes = payForm.notes;
      const res = await api.post('/finance/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsPayOpen(false);
      setPayForm({ amount: '', paymentMethod: 'EFT', referenceNumber: '', notes: '' });
      toast.success('Payment recorded successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const fromQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post('/finance/invoices/from-quote', { quoteId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accepted-quotes'] });
      setIsFromQuoteOpen(false);
      toast.success('Invoice created from quote');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const downloadInvoicePdf = async (id: string, invoiceNumber: string) => {
    try {
      const res = await api.get(`/finance/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
  };

  const resetForm = () => {
    setForm({ clientId: '', eventId: '', dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), discount: '0', taxRate: '15', notes: '', terms: '' });
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

  const viewInvoice = async (id: string) => {
    try {
      const res = await api.get(`/finance/invoices/${id}`);
      setViewingInvoice(res.data);
      setIsViewOpen(true);
    } catch { toast.error('Failed to load invoice'); }
  };

  const openPay = (invoiceId: string, balanceDue: number) => {
    setPayingInvoiceId(invoiceId);
    setPayForm({ amount: balanceDue.toFixed(2), paymentMethod: 'EFT', referenceNumber: '', notes: '' });
    setIsPayOpen(true);
  };

  const invoices = invoicesData?.invoices || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Invoices</h1><p className="text-muted-foreground">Manage invoices and payments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFromQuoteOpen(true)}><FileText className="mr-2 h-4 w-4" />From Quote</Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Invoices</p><p className="text-2xl font-bold">{invoicesData?.total || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Paid</p><p className="text-2xl font-bold text-green-600">{invoices.filter((i: any) => i.status === 'PAID').length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-blue-600">{invoices.filter((i: any) => ['SENT', 'PARTIALLY_PAID'].includes(i.status)).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-red-600">{invoices.filter((i: any) => i.status === 'OVERDUE').length}</p></CardContent></Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!invoices.length ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell></TableRow>
                ) : (
                  invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.client ? <Link href={`/clients/${inv.clientId}`} className="hover:underline">{inv.client.name}</Link> : '-'}</TableCell>
                      <TableCell>{inv.event ? <Link href={`/events/${inv.eventId}`} className="hover:underline">{inv.event.name}</Link> : '-'}</TableCell>
                      <TableCell className="font-medium">M {Number(inv.total).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">M {Number(inv.amountPaid || 0).toFixed(2)}</TableCell>
                      <TableCell className={Number(inv.balanceDue || 0) > 0 ? 'text-red-600 font-medium' : ''}>M {Number(inv.balanceDue || 0).toFixed(2)}</TableCell>
                      <TableCell>{inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '-'}</TableCell>
                      <TableCell><Badge className={`${statusColors[inv.status] || 'bg-gray-500'} text-white`}>{inv.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewInvoice(inv.id)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadInvoicePdf(inv.id, inv.invoiceNumber)}><Download className="mr-2 h-4 w-4" />Download PDF</DropdownMenuItem>
                            {inv.status === 'DRAFT' && <DropdownMenuItem onClick={() => statusMutation.mutate({ id: inv.id, status: 'SENT' })}><Send className="mr-2 h-4 w-4" />Mark as Sent</DropdownMenuItem>}
                            {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && (
                              <DropdownMenuItem onClick={() => openPay(inv.id, Number(inv.balanceDue || inv.total))}><CreditCard className="mr-2 h-4 w-4" />Record Payment</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {inv.status === 'DRAFT' && <DropdownMenuItem className="text-destructive" onClick={() => { setCancelId(inv.id); setIsCancelOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Cancel</DropdownMenuItem>}
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

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle><DialogDescription>Create a new invoice for a client.</DialogDescription></DialogHeader>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Line Items *</Label><Button type="button" variant="outline" size="sm" onClick={addLineItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button></div>
              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input className="flex-1" placeholder="Description" value={li.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} />
                    <Input className="w-20" type="number" min="1" placeholder="Qty" value={li.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} />
                    <Input className="w-28" type="number" min="0" step="0.01" placeholder="Price" value={li.unitPrice || ''} onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)} />
                    <span className="w-24 text-right pt-2 text-sm font-medium">R {(li.quantity * li.unitPrice).toFixed(2)}</span>
                    {lineItems.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(idx)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Discount (R)</Label><Input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" min="0" max="100" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
            </div>

            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

            <div className="border rounded p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>R {subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>- R {discount.toFixed(2)}</span></div>}
              {taxRate > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>R {tax.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>R {total.toFixed(2)}</span></div>
            </div>

            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.clientId || !lineItems.some((li) => li.description && li.unitPrice > 0)}>
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Invoice {viewingInvoice?.invoiceNumber}</DialogTitle><DialogDescription>Invoice details, line items, and payments.</DialogDescription></DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client:</span> {viewingInvoice.client ? <Link href={`/clients/${viewingInvoice.clientId}`} className="font-medium hover:underline">{viewingInvoice.client.name}</Link> : '-'}</div>
                <div><span className="text-muted-foreground">Event:</span> {viewingInvoice.event ? <Link href={`/events/${viewingInvoice.eventId}`} className="font-medium hover:underline">{viewingInvoice.event.name}</Link> : <span className="font-medium">-</span>}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={`${statusColors[viewingInvoice.status]} text-white`}>{viewingInvoice.status.replace('_', ' ')}</Badge></div>
                <div><span className="text-muted-foreground">Due:</span> <span>{viewingInvoice.dueDate ? format(new Date(viewingInvoice.dueDate), 'dd MMM yyyy') : '-'}</span></div>
                {viewingInvoice.quote && <div><span className="text-muted-foreground">From Quote:</span> <Link href="/quotes" className="font-mono hover:underline">{viewingInvoice.quote.quoteNumber}</Link></div>}
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {viewingInvoice.lineItems?.map((li: any) => (
                    <TableRow key={li.id}><TableCell>{li.description}</TableCell><TableCell>{li.quantity}</TableCell><TableCell>M {Number(li.unitPrice).toFixed(2)}</TableCell><TableCell className="text-right">R {(li.quantity * Number(li.unitPrice)).toFixed(2)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border rounded p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>M {Number(viewingInvoice.subtotal).toFixed(2)}</span></div>
                {Number(viewingInvoice.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>- R {Number(viewingInvoice.discount).toFixed(2)}</span></div>}
                {Number(viewingInvoice.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span>M {Number(viewingInvoice.tax).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>M {Number(viewingInvoice.total).toFixed(2)}</span></div>
              </div>
              {viewingInvoice.payments?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Payments</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {viewingInvoice.payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell>{format(new Date(p.paymentDate || p.createdAt), 'dd MMM yyyy')}</TableCell>
                          <TableCell><Badge variant="outline">{p.paymentMethod?.replace('_', ' ')}</Badge></TableCell>
                          <TableCell>{p.referenceNumber || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">M {Number(p.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => downloadInvoicePdf(viewingInvoice.id, viewingInvoice.invoiceNumber)}>
                <Download className="mr-2 h-4 w-4" />Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Record a payment for this invoice.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Amount (R) *</Label><Input type="number" min="0.01" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={payForm.paymentMethod} onValueChange={(v) => setPayForm({ ...payForm, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="ECOCASH">EcoCash</SelectItem>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="EFT">EFT / Bank Transfer</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reference Number</Label><Input value={payForm.referenceNumber} onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })} placeholder="e.g., TXN-12345" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending || !payForm.amount || Number(payForm.amount) <= 0}>
              {paymentMutation.isPending ? 'Recording...' : `Record Payment R ${Number(payForm.amount || 0).toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice from Quote Dialog */}
      <Dialog open={isFromQuoteOpen} onOpenChange={setIsFromQuoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Invoice from Quote</DialogTitle><DialogDescription>Select an accepted quote to convert into an invoice.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Accepted Quote *</Label>
              <Select value={fromQuoteId} onValueChange={setFromQuoteId}>
                <SelectTrigger><SelectValue placeholder="Select quote" /></SelectTrigger>
                <SelectContent>
                  {acceptedQuotesData?.quotes?.map((q: any) => (
                    <SelectItem key={q.id} value={q.id}>{q.quoteNumber} — {q.client?.name} — M {Number(q.total).toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => fromQuoteMutation.mutate(fromQuoteId)} disabled={fromQuoteMutation.isPending || !fromQuoteId}>
              {fromQuoteMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Confirmation */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Keep Invoice</Button>
            <Button variant="destructive" disabled={statusMutation.isPending} onClick={() => { if (cancelId) { statusMutation.mutate({ id: cancelId, status: 'CANCELLED' }); setIsCancelOpen(false); } }}>
              {statusMutation.isPending ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
