'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, Phone, Mail, Eye, Edit, MoreHorizontal, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api, { getErrorMessage } from '@/lib/api';
import { Client, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const emptyForm = { name: '', contactPerson: '', email: '', phone: '', alternatePhone: '', address: '', city: '', notes: '' };

function ClientForm({ form, setForm }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-2"><Label>Company/Client Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., ABC Events" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-2"><Label>Alternate Phone</Label><Input value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </div>
  );
}

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter === 'active') params.append('isActive', 'true');
      if (statusFilter === 'inactive') params.append('isActive', 'false');
      const res = await api.get<PaginatedResponse<Client>>(`/clients?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v));
      const res = await api.post('/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddOpen(false);
      setForm(emptyForm);
      toast.success('Client created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v));
      const res = await api.put(`/clients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditOpen(false);
      toast.success('Client updated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/clients/${id}/deactivate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deactivated');
      setIsDeactivateOpen(false);
      setDeactivateId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      contactPerson: client.contactPerson || '',
      email: client.email || '',
      phone: client.phone,
      alternatePhone: client.alternatePhone || '',
      address: client.address || '',
      city: client.city || '',
      notes: client.notes || '',
    });
    setIsEditOpen(true);
  };

  const totalClients = clientsData?.total || 0;
  const activeClients = clientsData?.items?.filter((c) => c.isActive).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setIsAddOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Clients</p><p className="text-2xl font-bold">{totalClients}</p></div><Users className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{activeClients}</p></div><UserCheck className="h-8 w-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Inactive</p><p className="text-2xl font-bold">{totalClients - activeClients}</p></div><UserX className="h-8 w-8 text-red-500" /></div></CardContent></Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search clients by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!clientsData?.items?.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No clients found.</TableCell></TableRow>
                ) : (
                  clientsData.items.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell><Link href={`/clients/${client.id}`} className="font-medium hover:underline">{client.name}</Link></TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{client.contactPerson || '-'}</div>
                          {client.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{client.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell><div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{client.phone}</div></TableCell>
                      <TableCell>{client.city || '-'}</TableCell>
                      <TableCell>{client._count?.events || 0}</TableCell>
                      <TableCell><Badge variant={client.isActive ? 'default' : 'secondary'}>{client.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/clients/${client.id}`}><Eye className="mr-2 h-4 w-4" />View</Link></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(client)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {client.isActive && (
                              <DropdownMenuItem className="text-destructive" onClick={() => { setDeactivateId(client.id); setIsDeactivateOpen(true); }}>
                                <UserX className="mr-2 h-4 w-4" />Deactivate
                              </DropdownMenuItem>
                            )}
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

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle><DialogDescription>Enter client details below.</DialogDescription></DialogHeader>
          <ClientForm form={form} setForm={setForm} />
          <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name || !form.phone}>
            {createMutation.isPending ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle><DialogDescription>Update client details.</DialogDescription></DialogHeader>
          <ClientForm form={form} setForm={setForm} />
          <Button className="w-full" onClick={() => updateMutation.mutate({ id: editingId, data: form })} disabled={updateMutation.isPending || !form.name || !form.phone}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this client? They will no longer appear in active client lists.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeactivateOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deactivateMutation.isPending} onClick={() => { if (deactivateId) deactivateMutation.mutate(deactivateId); }}>
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
