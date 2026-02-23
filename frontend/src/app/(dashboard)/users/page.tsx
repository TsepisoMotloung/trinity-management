'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import api, { getErrorMessage } from '@/lib/api';
import { User, PaginatedResponse } from '@/types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search, filterActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterActive !== 'all') params.append('isActive', filterActive);
      const res = await api.get<PaginatedResponse<User>>(`/users?${params}`);
      return res.data;
    },
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/users/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('User approved successfully');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
      setSuccessMessage(null);
    },
  });

  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/users/${userId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('User rejected successfully');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
      setSuccessMessage(null);
    },
  });

  // Deactivate / Activate user mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      if (isActive) {
        const res = await api.patch(`/users/${userId}`, { isActive: true });
        return res.data;
      } else {
        const res = await api.delete(`/users/${userId}`);
        return res.data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage(variables.isActive ? 'User activated' : 'User deactivated');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
      setSuccessMessage(null);
    },
  });

  const users = usersData?.items ?? [];

  // Client-side filter for approval status
  const filteredUsers = users.filter((user) => {
    if (filterApproval === 'pending') return !user.isApproved;
    if (filterApproval === 'approved') return user.isApproved;
    return true;
  });

  const pendingCount = users.filter((u) => !u.isApproved && u.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users and approve registrations</p>
      </div>

      {successMessage && <Alert>{successMessage}</Alert>}
      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* Pending Approvals Banner */}
      {pendingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Pending Approvals ({pendingCount})
            </CardTitle>
            <CardDescription>
              The following users have registered and are waiting for approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users
                .filter((u) => !u.isApproved && u.isActive)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 border"
                  >
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(user.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterApproval} onValueChange={setFilterApproval}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Approval Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' && <ShieldCheck className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isApproved ? (
                        <Badge variant="default" className="bg-green-600">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!user.isApproved && user.isActive && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isPending}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => rejectMutation.mutate(user.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {user.isApproved && user.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                userId: user.id,
                                isActive: false,
                              })
                            }
                            disabled={toggleActiveMutation.isPending}
                          >
                            Disable
                          </Button>
                        )}
                        {!user.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                userId: user.id,
                                isActive: true,
                              })
                            }
                            disabled={toggleActiveMutation.isPending}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
