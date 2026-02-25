'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Activity, Clock, User, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { ActionLog, PaginatedResponse } from '@/types';

const entityColors: Record<string, string> = {
  User: 'bg-blue-500',
  Event: 'bg-purple-500',
  Client: 'bg-green-500',
  EquipmentItem: 'bg-amber-500',
  EquipmentCategory: 'bg-amber-400',
  Quote: 'bg-indigo-500',
  Invoice: 'bg-cyan-500',
  Payment: 'bg-emerald-500',
  MaintenanceTicket: 'bg-orange-500',
  EventEquipmentBooking: 'bg-violet-500',
  StaffAssignment: 'bg-rose-500',
};

const actionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (action.includes('CREATE') || action.includes('CREATED')) return 'default';
  if (action.includes('DELETE') || action.includes('DELETED') || action.includes('CANCEL') || action.includes('REJECT')) return 'destructive';
  if (action.includes('UPDATE') || action.includes('UPDATED') || action.includes('STATUS')) return 'secondary';
  return 'outline';
};

export default function ActionLogsPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['action-logs', search, entityFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('skip', String(page * pageSize));
      params.append('take', String(pageSize));
      if (search) params.append('action', search);
      if (entityFilter !== 'all') params.append('entityType', entityFilter);
      const res = await api.get<PaginatedResponse<ActionLog>>(`/action-logs?${params}`);
      return res.data;
    },
  });

  const logs = logsData?.items || [];
  const totalPages = Math.ceil((logsData?.total || 0) / pageSize);

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details || Object.keys(details).length === 0) return null;
    const entries = Object.entries(details).filter(([k]) => !['changes', 'ipAddress'].includes(k));
    if (entries.length === 0) return null;
    return entries.map(([key, value]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `${key.replace(/([A-Z])/g, ' $1').trim()}: ${displayValue}`;
    }).join(' | ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Action Logs</h1>
        <p className="text-muted-foreground">Audit trail of all system activity</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-500" />
            <div><p className="text-sm text-muted-foreground">Total Logs</p><p className="text-2xl font-bold">{logsData?.total || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Clock className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Latest Activity</p>
              <p className="text-sm font-medium">{logs[0] ? format(new Date(logs[0].createdAt), 'dd MMM yyyy HH:mm') : '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <User className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Last Actor</p>
              <p className="text-sm font-medium">{logs[0]?.user ? `${logs[0].user.firstName} ${logs[0].user.lastName}` : '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by action name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
              <SelectTrigger className="w-56">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                <SelectItem value="User">Users</SelectItem>
                <SelectItem value="Event">Events</SelectItem>
                <SelectItem value="Client">Clients</SelectItem>
                <SelectItem value="EquipmentItem">Equipment Items</SelectItem>
                <SelectItem value="EquipmentCategory">Equipment Categories</SelectItem>
                <SelectItem value="EventEquipmentBooking">Equipment Bookings</SelectItem>
                <SelectItem value="StaffAssignment">Staff Assignments</SelectItem>
                <SelectItem value="Quote">Quotes</SelectItem>
                <SelectItem value="Invoice">Invoices</SelectItem>
                <SelectItem value="Payment">Payments</SelectItem>
                <SelectItem value="MaintenanceTicket">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!logs.length ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No action logs found.</TableCell></TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {format(new Date(log.createdAt), 'dd MMM yyyy')}<br />
                          <span className="text-xs">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="text-sm">
                              <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                              <p className="text-xs text-muted-foreground">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionBadgeVariant(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`${entityColors[log.entityType] || 'bg-gray-500'} text-white text-xs`}>
                              {log.entityType}
                            </Badge>
                          </div>
                          {log.entityId && <p className="text-xs text-muted-foreground mt-1 font-mono">{log.entityId.substring(0, 8)}...</p>}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {formatDetails(log.details) ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">{formatDetails(log.details)}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, logsData?.total || 0)} of {logsData?.total || 0}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
