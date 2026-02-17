'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, Users, AlertTriangle, DollarSign, Wrench } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: equipmentStats } = useQuery({
    queryKey: ['equipment-stats'],
    queryFn: async () => {
      const res = await api.get('/equipment/statistics');
      return res.data;
    },
  });

  const { data: eventStats } = useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => {
      const res = await api.get('/events/statistics');
      return res.data;
    },
  });

  const stats = [
    {
      title: 'Total Equipment',
      value: equipmentStats?.totalCount || 0,
      icon: Package,
      description: 'Items in inventory',
      color: 'text-blue-500',
    },
    {
      title: 'Available',
      value: equipmentStats?.byStatus?.find((s: any) => s.status === 'AVAILABLE')?.count || 0,
      icon: Package,
      description: 'Ready for booking',
      color: 'text-green-500',
    },
    {
      title: 'Upcoming Events',
      value: eventStats?.upcoming || 0,
      icon: Calendar,
      description: 'Events scheduled',
      color: 'text-purple-500',
    },
    {
      title: 'This Month',
      value: eventStats?.thisMonth || 0,
      icon: Calendar,
      description: 'Events this month',
      color: 'text-orange-500',
    },
    {
      title: 'Under Repair',
      value: equipmentStats?.byStatus?.find((s: any) => s.status === 'UNDER_REPAIR')?.count || 0,
      icon: Wrench,
      description: 'Items being repaired',
      color: 'text-yellow-500',
    },
    {
      title: 'Damaged',
      value: equipmentStats?.byStatus?.find((s: any) => s.status === 'DAMAGED')?.count || 0,
      icon: AlertTriangle,
      description: 'Requires attention',
      color: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats by Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipmentStats?.byStatus?.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {item.status.toLowerCase().replace('_', ' ')}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventStats?.byStatus?.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {item.status.toLowerCase().replace('_', ' ')}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
