'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Edit, Trash2, Eye, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import api, { getErrorMessage } from '@/lib/api';
import { EquipmentItem, EquipmentCategory, EquipmentStatus, EquipmentStatistics, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const statusColors: Record<EquipmentStatus, string> = {
  [EquipmentStatus.AVAILABLE]: 'bg-green-600',
  [EquipmentStatus.RESERVED]: 'bg-blue-600',
  [EquipmentStatus.IN_USE]: 'bg-purple-600',
  [EquipmentStatus.DAMAGED]: 'bg-red-600',
  [EquipmentStatus.UNDER_REPAIR]: 'bg-yellow-600',
  [EquipmentStatus.LOST]: 'bg-gray-600',
  [EquipmentStatus.RETIRED]: 'bg-gray-400',
};

const emptyForm = {
  name: '', description: '', categoryId: '', serialNumber: '', barcode: '',
  purchaseDate: '', purchasePrice: '', notes: '',
};

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusForm, setStatusForm] = useState({ status: '', reason: '' });

  const { data: categoriesData } = useQuery({
    queryKey: ['equipment-categories'],
    queryFn: async () => {
      const res = await api.get<EquipmentCategory[]>('/equipment/categories');
      return res.data;
    },
  });

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['equipment-items', search, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      const res = await api.get<PaginatedResponse<EquipmentItem>>(`/equipment/items?${params}`);
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['equipment-stats'],
    queryFn: async () => {
      const res = await api.get<EquipmentStatistics>('/equipment/statistics');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/equipment/items', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-stats'] });
      setIsAddOpen(false);
      setForm(emptyForm);
      toast.success('Equipment added successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await api.patch(`/equipment/items/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      setIsEditOpen(false);
      setSelectedItem(null);
      toast.success('Equipment updated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason: string }) => {
      const res = await api.patch(`/equipment/items/${id}/status`, { status, reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-stats'] });
      setIsStatusOpen(false);
      setSelectedItem(null);
      toast.success('Status updated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/equipment/items/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-stats'] });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      toast.success('Equipment deleted successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      name: form.name,
      categoryId: form.categoryId,
      description: form.description || undefined,
      serialNumber: form.serialNumber || undefined,
      barcode: form.barcode || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
      notes: form.notes || undefined,
    };
    return payload;
  };

  const openEdit = (item: EquipmentItem) => {
    setSelectedItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId,
      serialNumber: item.serialNumber || '',
      barcode: item.barcode || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : '',
      purchasePrice: item.purchasePrice?.toString() || '',
      notes: item.notes || '',
    });
    setIsEditOpen(true);
  };

  const openStatusChange = (item: EquipmentItem) => {
    setSelectedItem(item);
    setStatusForm({ status: item.currentStatus, reason: '' });
    setIsStatusOpen(true);
  };

  const categories = categoriesData || [];

  const EquipmentForm = ({ onSubmit, isPending, submitLabel }: { onSubmit: () => void; isPending: boolean; submitLabel: string }) => (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Mic 1, Speaker 3" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Category *</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Equipment description" />
        </div>
        <div className="space-y-2">
          <Label>Serial Number</Label>
          <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Barcode</Label>
          <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Purchase Price (M)</Label>
          <Input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={isPending || !form.name || !form.categoryId}>
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">Manage your equipment inventory — each physical unit is tracked individually</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (open) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Equipment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>Add a new physical unit to your inventory (e.g., Mic 1, Speaker 3).</DialogDescription>
            </DialogHeader>
            <EquipmentForm onSubmit={() => createMutation.mutate(buildPayload())} isPending={createMutation.isPending} submitLabel="Add Equipment" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{statsData?.totalItems || 0}</div><p className="text-xs text-muted-foreground">{statsData?.totalCategories || 0} categories</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{statsData?.totalAvailable || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{statsData?.totalReserved || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{statsData?.totalInUse || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Damaged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{statsData?.totalDamaged || 0}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, serial number, or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c._count?.items || 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(EquipmentStatus).map((s) => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />Equipment ({itemsData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
          ) : !itemsData?.items?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No equipment found. Add your first item to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/equipment/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
                      {item.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>}
                    </TableCell>
                    <TableCell>{item.category?.name || '-'}</TableCell>
                    <TableCell className="text-sm font-mono">{item.serialNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[item.currentStatus]} text-white`}>{item.currentStatus.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">•••</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/equipment/${item.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusChange(item)}><Wrench className="mr-2 h-4 w-4" />Change Status</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update details for {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <EquipmentForm onSubmit={() => selectedItem && updateMutation.mutate({ id: selectedItem.id, data: buildPayload() })} isPending={updateMutation.isPending} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Equipment Status</DialogTitle>
            <DialogDescription>Update status for {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusForm.status} onValueChange={(v) => setStatusForm({ ...statusForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="UNDER_REPAIR">Under Repair</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} placeholder="Reason for status change" />
            </div>
            <Button className="w-full" onClick={() => selectedItem && statusMutation.mutate({ id: selectedItem.id, ...statusForm })} disabled={statusMutation.isPending || !statusForm.status}>
              {statusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
            <DialogDescription>Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
