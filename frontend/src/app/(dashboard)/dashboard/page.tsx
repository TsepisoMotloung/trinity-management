'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Package, Users, DollarSign, AlertTriangle, Wrench, Clock, TrendingUp, ArrowRight, Plus, FileText } from 'lucide-react';
import { format, isBefore, isAfter, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: equipmentStats } = useQuery({
    queryKey: ['equipment-stats'],
    queryFn: async () => { const res = await api.get('/equipment/statistics'); return res.data; },
  });

  const { data: eventStats } = useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => { const res = await api.get('/events/statistics'); return res.data; },
  });

  const { data: maintenanceStats } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => { const res = await api.get('/maintenance/statistics'); return res.data; },
  });

  const { data: financeSummary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => { const res = await api.get('/finance/summary'); return res.data; },
  });

  const { data: upcomingEventsData } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const now = new Date();
      const future = addDays(now, 30);
      const res = await api.get(`/events/calendar?startDate=${now.toISOString()}&endDate=${future.toISOString()}`);
      return res.data;
    },
  });

  const { data: pendingCheckIns } = useQuery({
    queryKey: ['pending-check-ins'],
    queryFn: async () => { const res = await api.get('/transactions/pending'); return res.data; },
  });

  const { data: overdueCheckIns } = useQuery({
    queryKey: ['overdue-check-ins'],
    queryFn: async () => { const res = await api.get('/transactions/overdue'); return res.data; },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: async () => { const res = await api.get('/action-logs?take=8'); return res.data; },
  });

  const availableCount = equipmentStats?.totalAvailable || 0;
  const inUseCount = equipmentStats?.totalInUse || 0;
  const reservedCount = equipmentStats?.totalReserved || 0;
  const damagedCount = equipmentStats?.totalDamaged || 0;
  const underRepairCount = 0; // tracked via maintenance tickets now
  const upcomingEvents = upcomingEventsData || [];
  const overdueCount = overdueCheckIns?.totalOverdue || 0;
  const pendingCount = pendingCheckIns?.totalPending || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || 'User'}</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, dd MMMM yyyy')} — Here&apos;s your business overview</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href="/events"><Plus className="mr-2 h-4 w-4" />New Event</Link></Button>
          <Button asChild variant="outline"><Link href="/quotes"><FileText className="mr-2 h-4 w-4" />New Quote</Link></Button>
          <Button asChild variant="outline"><Link href="/clients"><Users className="mr-2 h-4 w-4" />Clients</Link></Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">{availableCount} available · {inUseCount} in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats?.upcoming || 0}</div>
            <p className="text-xs text-muted-foreground">{eventStats?.thisMonth || 0} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">M {Number(financeSummary?.totalRevenue || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">M {Number(financeSummary?.outstandingAmount || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })} outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(maintenanceStats?.openTickets || 0) + (maintenanceStats?.inProgressTickets || 0)}</div>
            <p className="text-xs text-muted-foreground">{maintenanceStats?.openTickets || 0} open · {maintenanceStats?.inProgressTickets || 0} in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(overdueCount > 0 || damagedCount > 0 || underRepairCount > 0 || (financeSummary?.outstandingCount || 0) > 0) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overdueCount > 0 && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-400">Overdue Returns</p>
                    <p className="text-sm text-red-700 dark:text-red-400">{overdueCount} equipment item(s) overdue for check-in</p>
                    <Link href="/events"><Button variant="link" className="p-0 h-auto text-red-700 dark:text-red-400">View details <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {(damagedCount + underRepairCount) > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-400">Equipment Issues</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">{damagedCount} damaged · {underRepairCount} under repair</p>
                    <Link href="/maintenance"><Button variant="link" className="p-0 h-auto text-amber-700 dark:text-amber-400">View maintenance <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {(financeSummary?.outstandingCount || 0) > 0 && (
            <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-400">Outstanding Invoices</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{financeSummary.outstandingCount} unpaid invoice(s) — M {Number(financeSummary.outstandingAmount).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</p>
                    <Link href="/invoices"><Button variant="link" className="p-0 h-auto text-blue-700 dark:text-blue-400">View invoices <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
            <Link href="/events"><Button variant="outline" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming events in the next 30 days.</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 6).map((event: any) => {
                  const isToday = format(new Date(event.startDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isTomorrow = format(new Date(event.startDate), 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd');
                  return (
                    <div key={event.id} className={`flex items-start justify-between p-3 rounded-lg border ${isToday ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/events/${event.id}`} className="font-medium hover:underline">{event.name}</Link>
                          {isToday && <Badge className="bg-green-600 text-white text-xs">Today</Badge>}
                          {isTomorrow && <Badge variant="outline" className="text-xs">Tomorrow</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.client ? <Link href={`/clients/${event.client.id}`} className="hover:underline">{event.client.name}</Link> : '-'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(event.startDate), 'EEE, dd MMM · HH:mm')} — {format(new Date(event.endDate), 'HH:mm')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{event._count?.equipmentBookings || 0} items</Badge>
                        <Badge
                          className={`text-xs text-white ${
                            event.status === 'CONFIRMED' ? 'bg-green-600' :
                            event.status === 'DRAFT' ? 'bg-gray-500' :
                            event.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}
                        >{event.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Overview + Pending Returns */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Equipment Status</CardTitle>
              <Link href="/equipment"><Button variant="outline" size="sm">Manage</Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[{
                  label: 'Available', count: availableCount, color: 'bg-green-500',
                }, {
                  label: 'Reserved', count: reservedCount, color: 'bg-blue-400',
                }, {
                  label: 'In Use', count: inUseCount, color: 'bg-purple-500',
                }, {
                  label: 'Damaged', count: damagedCount, color: 'bg-red-500',
                }].filter(s => s.count > 0).map((item) => {
                  const total = equipmentStats?.totalItems || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {(equipmentStats?.totalItems || 0) === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
              </div>
            </CardContent>
          </Card>

          {/* Pending Returns */}
          {pendingCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Returns ({pendingCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingCheckIns?.byEvent?.slice(0, 4).map((group: any) => (
                    <div key={group.event.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <Link href={`/events/${group.event.id}`} className="text-sm font-medium hover:underline">{group.event.name}</Link>
                        <p className="text-xs text-muted-foreground">
                          {group.event.endDate && isBefore(new Date(group.event.endDate), new Date()) ? (
                            <span className="text-red-600">Event ended {format(new Date(group.event.endDate), 'dd MMM')}</span>
                          ) : (
                            <span>Ends {group.event.endDate ? format(new Date(group.event.endDate), 'dd MMM HH:mm') : '-'}</span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">{group.items.length} item(s)</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </div>
          <Link href="/logs"><Button variant="outline" size="sm">View All</Button></Link>
        </CardHeader>
        <CardContent>
          {recentLogs?.items?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs?.items?.slice(0, 8).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground w-32 flex-shrink-0">
                    {format(new Date(log.createdAt), 'dd MMM HH:mm')}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{log.user?.firstName} {log.user?.lastName}</span>
                    {' '}
                    <span className="lowercase">{log.action.replace(/_/g, ' ')}</span>
                    {' '}
                    <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                    {log.details?.name && <span> — {log.details.name}</span>}
                    {log.details?.equipmentName && <span> — {log.details.equipmentName}</span>}
                    {log.details?.quoteNumber && <span> — {log.details.quoteNumber}</span>}
                    {log.details?.invoiceNumber && <span> — {log.details.invoiceNumber}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events by Status / Financial Quick View */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventStats?.byStatus?.map((item: any) => {
                const colors: Record<string, string> = {
                  DRAFT: 'bg-gray-500', QUOTED: 'bg-indigo-500', CONFIRMED: 'bg-green-600',
                  IN_PROGRESS: 'bg-blue-500', COMPLETED: 'bg-emerald-600', CANCELLED: 'bg-red-400',
                };
                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[item.status] || 'bg-gray-400'}`} />
                      <span className="text-sm capitalize">{item.status.toLowerCase().replace('_', ' ')}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                );
              }) || <p className="text-muted-foreground text-sm text-center py-4">No data</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Revenue</span>
                </div>
                <span className="font-bold text-green-700">M {Number(financeSummary?.totalRevenue || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Outstanding</span>
                </div>
                <span className="font-bold text-amber-700">M {Number(financeSummary?.outstandingAmount || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })}</span>
              </div>
              {financeSummary?.recentPayments?.length > 0 && (
                <div>
                  <Separator className="my-3" />
                  <p className="text-sm font-medium mb-2">Recent Payments</p>
                  <div className="space-y-2">
                    {financeSummary.recentPayments.slice(0, 4).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{p.invoice?.client?.name || 'Unknown'}</span>
                        <span className="font-medium text-green-600">+ M {Number(p.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
