'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { cn, formatDate } from '@/lib/utils';
import { Users, FileText, Shield, BarChart2, TrendingUp, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    listings: 0,
    deals: 0,
    verification: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setStats({ users: 42, listings: 128, deals: 23, verification: 7 });
    setRecentUsers([
      { id: '1', email: 'founder@acme.com', name: 'John Founder', role: 'ADMIN', createdAt: '2024-01-15', status: 'active' },
      { id: '2', email: 'jane@techstart.io', name: 'Jane Tech', role: 'OPERATOR', createdAt: '2024-01-18', status: 'active' },
      { id: '3', email: 'bob@globaltrade.com', name: 'Bob Global', role: 'VIEWER', createdAt: '2024-01-20', status: 'inactive' },
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Card key={i} variant="outlined" className="animate-pulse h-24" />)}
        </div>
        <Card variant="outlined" className="animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Admin Dashboard</h1>
        <p className="text-nexus-500 dark:text-nexus-400 mt-1">Platform overview and administration</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.users, icon: Users, color: 'text-hydra-600 bg-hydra-100 dark:bg-hydra-900/30 dark:text-hydra-400' },
          { label: 'Active Listings', value: stats.listings, icon: FileText, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
          { label: 'Active Deals', value: stats.deals, icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Pending Verification', value: stats.verification, icon: Shield, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
        ].map((stat) => (
          <Card key={stat.label} variant="outlined" className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-nexus-500 dark:text-nexus-400">{stat.label}</p>
              <p className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/audit" className="block">
          <Card variant="outlined" className="hover:shadow-md transition-shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-hydra-600 dark:text-hydra-400" />
              </div>
              <div>
                <h3 className="font-semibold text-nexus-900 dark:text-nexus-100">Audit Log</h3>
                <p className="text-sm text-nexus-500 dark:text-nexus-400">Review all platform activity</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/users" className="block">
          <Card variant="outlined" className="hover:shadow-md transition-shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-nexus-900 dark:text-nexus-100">User Management</h3>
                <p className="text-sm text-nexus-500 dark:text-nexus-400">Manage users and permissions</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/verification" className="block">
          <Card variant="outlined" className="hover:shadow-md transition-shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-nexus-900 dark:text-nexus-100">Verification Queue</h3>
                <p className="text-sm text-nexus-500 dark:text-nexus-400">Review pending verifications</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Users */}
      <Card variant="outlined" padding="none">
        <Table
          columns={[
            { key: 'email', header: 'Email' },
            { key: 'name', header: 'Name' },
            { key: 'role', header: 'Role', render: (row: any) => <Badge variant="default" size="sm">{row.role}</Badge> },
            { key: 'status', header: 'Status', render: (row: any) => <Badge variant={row.status === 'active' ? 'success' : 'default'} size="sm">{row.status}</Badge> },
            { key: 'createdAt', header: 'Joined', render: (row: any) => formatDate(row.createdAt) },
          ]}
          data={recentUsers}
          keyField="id"
          hoverable
          emptyMessage="No users yet"
        />
      </Card>

      {/* Platform Health */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="outlined" padding="lg">
          <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-hydra-600" />
            Platform Health
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-nexus-500 dark:text-nexus-400">Database</span>
              <Badge variant="success" size="sm">Healthy</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-nexus-500 dark:text-nexus-400">API</span>
              <Badge variant="success" size="sm">Operational</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-nexus-500 dark:text-nexus-400">Ollama Cloud</span>
              <Badge variant="success" size="sm">Connected</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-nexus-500 dark:text-nexus-400">Email Service</span>
              <Badge variant="warning" size="sm">Not Configured</Badge>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="lg">
          <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-hydra-600" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link href="/admin/audit" className="block p-3 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors text-sm text-nexus-700 dark:text-nexus-300">View Audit Log</Link>
            <Link href="/admin/users" className="block p-3 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors text-sm text-nexus-700 dark:text-nexus-300">Manage Users</Link>
            <Link href="/dashboard/verification" className="block p-3 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors text-sm text-nexus-700 dark:text-nexus-300">Review Verifications</Link>
            <Link href="/dashboard" className="block p-3 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors text-sm text-nexus-700 dark:text-nexus-300">View Marketplace</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}