'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Wrench, MoreHorizontal, Play, CheckCircle, XCircle, UserPlus, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
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
import { MaintenanceResponse, EquipmentItem, PaginatedResponse, User, MaintenanceTicket } from '@/types';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  WAITING_PARTS: 'bg-purple-500',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-gray-400',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<MaintenanceTicket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [form, setForm] = useState({ equipmentId: '', title: '', description: '', reportedIssue: '', priority: 'MEDIUM' });
  const [completeForm, setCompleteForm] = useState({ repairNotes: '', diagnosis: '', setAvailable: true });
  const [assignUserId, setAssignUserId] = useState('');
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['maintenance', search, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      params.append('take', '100');
      const res = await api.get<MaintenanceResponse>(`/maintenance?${params}`);
      return res.data;
    },
  });

  const { data: equipmentData } = useQuery({
    queryKey: ['equipment-select'],
    queryFn: async () => { const res = await api.get<PaginatedResponse<EquipmentItem>>('/equipment/items?take=200'); return res.data; },
    enabled: isCreateOpen,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: async () => { const res = await api.get<PaginatedResponse<User>>('/users?take=100'); return res.data; },
    enabled: isAssignOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/maintenance', form);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsCreateOpen(false);
      setForm({ equipmentId: '', title: '', description: '', reportedIssue: '', priority: 'MEDIUM' });
      toast.success('Maintenance ticket created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await api.patch(`/maintenance/${id}/status`, { status, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Ticket status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/maintenance/${selectedTicketId}/complete`, completeForm);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsCompleteOpen(false);
      toast.success('Maintenance ticket completed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/maintenance/${selectedTicketId}`, { assignedToId: assignUserId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsAssignOpen(false);
      toast.success('Technician assigned');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/maintenance/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Ticket cancelled');
      setIsCancelOpen(false);
      setCancelId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const viewTicket = async (id: string) => {
    try {
      const res = await api.get(`/maintenance/${id}`);
      setViewingTicket(res.data);
      setIsViewOpen(true);
    } catch { toast.error('Failed to load ticket'); }
  };

  const openComplete = (id: string) => {
    setSelectedTicketId(id);
    setCompleteForm({ repairNotes: '', diagnosis: '', setAvailable: true });
    setIsCompleteOpen(true);
  };

  const openAssign = (id: string) => {
    setSelectedTicketId(id);
    setAssignUserId('');
    setIsAssignOpen(true);
  };

  const tickets = ticketsData?.tickets || [];
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL' && !['COMPLETED', 'CANCELLED'].includes(t.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Track equipment repairs and maintenance</p>
        </div>
        <Button onClick={() => { setForm({ equipmentId: '', title: '', description: '', reportedIssue: '', priority: 'MEDIUM' }); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Tickets</p><p className="text-2xl font-bold">{ticketsData?.total || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Open</p><p className="text-2xl font-bold text-blue-600">{openCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-amber-600">{inProgressCount}</p></CardContent></Card>
        <Card className={criticalCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {criticalCount > 0 && <AlertTriangle className="h-4 w-4 text-red-600" />}
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!tickets.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No maintenance tickets found.</TableCell></TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className={ticket.priority === 'CRITICAL' && !['COMPLETED', 'CANCELLED'].includes(ticket.status) ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.equipment?.name}</p>
                          <p className="text-xs text-muted-foreground">{(ticket.equipment as any)?.category?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{ticket.title}</p>
                        {ticket.reportedIssue && <p className="text-xs text-muted-foreground line-clamp-1">{ticket.reportedIssue}</p>}
                      </TableCell>
                      <TableCell><Badge className={`${priorityColors[ticket.priority]} text-white`}>{ticket.priority}</Badge></TableCell>
                      <TableCell><Badge className={`${statusColors[ticket.status]} text-white`}>{ticket.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>
                        {ticket.assignedTo ? (
                          <span className="text-sm">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(ticket.createdAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewTicket(ticket.id)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            {ticket.status === 'OPEN' && (
                              <>
                                <DropdownMenuItem onClick={() => openAssign(ticket.id)}><UserPlus className="mr-2 h-4 w-4" />Assign Technician</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => statusMutation.mutate({ id: ticket.id, status: 'IN_PROGRESS' })}><Play className="mr-2 h-4 w-4" />Start Work</DropdownMenuItem>
                              </>
                            )}
                            {ticket.status === 'IN_PROGRESS' && (
                              <>
                                <DropdownMenuItem onClick={() => statusMutation.mutate({ id: ticket.id, status: 'WAITING_PARTS' })}><Wrench className="mr-2 h-4 w-4" />Waiting for Parts</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openComplete(ticket.id)}><CheckCircle className="mr-2 h-4 w-4" />Complete</DropdownMenuItem>
                              </>
                            )}
                            {ticket.status === 'WAITING_PARTS' && (
                              <>
                                <DropdownMenuItem onClick={() => statusMutation.mutate({ id: ticket.id, status: 'IN_PROGRESS' })}><Play className="mr-2 h-4 w-4" />Resume Work</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openComplete(ticket.id)}><CheckCircle className="mr-2 h-4 w-4" />Complete</DropdownMenuItem>
                              </>
                            )}
                            {!['COMPLETED', 'CANCELLED'].includes(ticket.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => { setCancelId(ticket.id); setIsCancelOpen(true); }}><XCircle className="mr-2 h-4 w-4" />Cancel Ticket</DropdownMenuItem>
                              </>
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

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Maintenance Ticket</DialogTitle><DialogDescription>Report an issue with equipment.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Equipment *</Label>
              <Select value={form.equipmentId} onValueChange={(v) => setForm({ ...form, equipmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>
                  {equipmentData?.items?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} {e.category ? `(${e.category.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Speaker not producing sound" />
            </div>
            <div className="space-y-2">
              <Label>Reported Issue *</Label>
              <Textarea value={form.reportedIssue} onChange={(e) => setForm({ ...form, reportedIssue: e.target.value })} placeholder="Describe the issue in detail..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional notes..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.equipmentId || !form.title || !form.reportedIssue}>
              {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ticket Details</DialogTitle><DialogDescription>Full details for this maintenance ticket.</DialogDescription></DialogHeader>
          {viewingTicket && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Badge className={`${priorityColors[viewingTicket.priority]} text-white`}>{viewingTicket.priority}</Badge>
                <Badge className={`${statusColors[viewingTicket.status]} text-white`}>{viewingTicket.status.replace('_', ' ')}</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{viewingTicket.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{viewingTicket.equipment?.name} — {(viewingTicket.equipment as any)?.category?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border rounded-lg p-4">
                <div><span className="text-muted-foreground">Created by:</span><p className="font-medium">{viewingTicket.createdBy?.firstName} {viewingTicket.createdBy?.lastName}</p></div>
                <div><span className="text-muted-foreground">Assigned to:</span><p className="font-medium">{viewingTicket.assignedTo ? `${viewingTicket.assignedTo.firstName} ${viewingTicket.assignedTo.lastName}` : 'Unassigned'}</p></div>
                <div><span className="text-muted-foreground">Created:</span><p>{format(new Date(viewingTicket.createdAt), 'dd MMM yyyy HH:mm')}</p></div>
                <div><span className="text-muted-foreground">Started:</span><p>{viewingTicket.startedAt ? format(new Date(viewingTicket.startedAt), 'dd MMM yyyy HH:mm') : '-'}</p></div>
                {viewingTicket.completedAt && <div><span className="text-muted-foreground">Completed:</span><p>{format(new Date(viewingTicket.completedAt), 'dd MMM yyyy HH:mm')}</p></div>}
                {viewingTicket.vendorName && <div><span className="text-muted-foreground">Vendor:</span><p>{viewingTicket.vendorName}</p></div>}
              </div>
              <div className="space-y-3">
                <div><h4 className="font-medium text-sm text-muted-foreground">Reported Issue</h4><p className="text-sm mt-1">{viewingTicket.reportedIssue}</p></div>
                {viewingTicket.description && <div><h4 className="font-medium text-sm text-muted-foreground">Description</h4><p className="text-sm mt-1">{viewingTicket.description}</p></div>}
                {viewingTicket.diagnosis && <div><h4 className="font-medium text-sm text-muted-foreground">Diagnosis</h4><p className="text-sm mt-1">{viewingTicket.diagnosis}</p></div>}
                {viewingTicket.repairNotes && <div><h4 className="font-medium text-sm text-muted-foreground">Repair Notes</h4><p className="text-sm mt-1">{viewingTicket.repairNotes}</p></div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Ticket Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Complete Maintenance</DialogTitle><DialogDescription>Record repair details and return equipment to service.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Repair Notes *</Label>
              <Textarea value={completeForm.repairNotes} onChange={(e) => setCompleteForm({ ...completeForm, repairNotes: e.target.value })} placeholder="What was done to fix the issue..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea value={completeForm.diagnosis} onChange={(e) => setCompleteForm({ ...completeForm, diagnosis: e.target.value })} placeholder="Root cause of the issue..." rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="setAvailable" checked={completeForm.setAvailable} onChange={(e) => setCompleteForm({ ...completeForm, setAvailable: e.target.checked })} className="rounded" />
              <Label htmlFor="setAvailable">Return equipment to available status</Label>
            </div>
            <Button className="w-full" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || !completeForm.repairNotes}>
              {completeMutation.isPending ? 'Completing...' : 'Complete Maintenance'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Technician</DialogTitle><DialogDescription>Select a staff member to handle this maintenance.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Technician *</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {usersData?.items?.filter((u) => u.isActive).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !assignUserId}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Technician'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Maintenance Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this maintenance ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Keep Open</Button>
            <Button variant="destructive" disabled={cancelMutation.isPending} onClick={() => { if (cancelId) cancelMutation.mutate(cancelId); }}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Ticket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
