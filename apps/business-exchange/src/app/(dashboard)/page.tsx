'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Plus, TrendingUp, Users, Briefcase, FileText, DollarSign, ArrowRight, Clock, Building2, Handshake, Gem } from 'lucide-react';

const stats = [
  { label: 'Active Listings', value: '12', change: '+3', icon: Briefcase, color: 'text-hydra-600 bg-hydra-100 dark:bg-hydra-900/30 dark:text-hydra-400' },
  { label: 'Open Deals', value: '5', change: '+1', icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: 'Messages', value: '23', change: '+7', icon: Handshake, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Pipeline Value', value: '$127K', change: '+$23K', icon: DollarSign, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
];

const recentDeals = [
  { id: '1', title: 'SaaS Platform Acquisition', type: 'BUSINESS_SALE', status: 'NEGOTIATION', price: '$250,000', updated: '2h ago' },
  { id: '2', title: 'Marketing Automation Services', type: 'SERVICE', status: 'CONTRACT_SIGNED', price: '$15,000', updated: '1d ago' },
  { id: '3', title: 'Domain Portfolio Sale', type: 'ASSET_SALE', status: 'COMPLETED', price: '$45,000', updated: '3d ago' },
  { id: '4', title: 'Referral: Dev Shop Introduction', type: 'REFERRAL', status: 'NEGOTIATION', price: 'Commission', updated: '5d ago' },
];

const typeIcons = {
  SERVICE: Briefcase,
  PROJECT: Building2,
  REFERRAL: Handshake,
  BUSINESS_SALE: Building2,
  ASSET_SALE: Gem,
};

const statusConfig = {
  NEGOTIATION: { label: 'Negotiation', variant: 'primary' as const },
  CONTRACT_SIGNED: { label: 'Contract Signed', variant: 'success' as const },
  COMPLETED: { label: 'Completed', variant: 'info' as const },
  ARCHIVED: { label: 'Archived', variant: 'default' as const },
} as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Marketplace Dashboard</h1>
          <p className="text-nexus-500 dark:text-nexus-400 mt-1">Overview of your marketplace activity</p>
        </div>
        <Link href="/dashboard/listings/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="outlined" className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-nexus-500 dark:text-nexus-400">{stat.label}</p>
              <p className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">{stat.value}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{stat.change} this month</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Deals */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <Card variant="outlined" padding="md">
            <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/dashboard/listings/create" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-hydra-600 dark:text-hydra-400" />
                </div>
                <div>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">Create Listing</p>
                  <p className="text-xs text-nexus-500 dark:text-nexus-400">Post a service, project, or sale</p>
                </div>
              </Link>
              <Link href="/dashboard/explore" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">Explore Marketplace</p>
                  <p className="text-xs text-nexus-500 dark:text-nexus-400">Browse listings and opportunities</p>
                </div>
              </Link>
              <Link href="/dashboard/pipeline" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">View Pipeline</p>
                  <p className="text-xs text-nexus-500 dark:text-nexus-400">Manage active deals</p>
                </div>
              </Link>
              <Link href="/dashboard/messages" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Handshake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">Messages</p>
                  <p className="text-xs text-nexus-500 dark:text-nexus-400">23 unread messages</p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Listing Type Guide */}
          <Card variant="outlined" padding="md">
            <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Listing Types</h3>
            <div className="space-y-3 text-sm">
              {[
                { icon: Briefcase, label: 'Service', desc: 'Professional services & consulting' },
                { icon: Building2, label: 'Project', desc: 'Fixed-scope project work' },
                { icon: Handshake, label: 'Referral', desc: 'Lead referrals with commission' },
                { icon: Building2, label: 'Business Sale', desc: 'Full company acquisitions' },
                { icon: Gem, label: 'Asset Sale', desc: 'Domains, IP, code, lists' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-nexus-500" />
                  <div>
                    <p className="font-medium text-nexus-900 dark:text-nexus-100">{label}</p>
                    <p className="text-xs text-nexus-500 dark:text-nexus-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Deals */}
        <div className="lg:col-span-2">
          <Card variant="outlined" padding="none">
            <div className="p-6 border-b border-nexus-200 dark:border-nexus-800 flex items-center justify-between">
              <h3 className="font-semibold text-nexus-900 dark:text-nexus-100">Recent Deals</h3>
              <Link href="/dashboard/pipeline" className="text-sm text-hydra-600 dark:text-hydra-400 hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-nexus-200 dark:divide-nexus-800">
              {recentDeals.map((deal) => {
                const Icon = typeIcons[deal.type as keyof typeof typeIcons] || Briefcase;
                const statusCfg = statusConfig[deal.status as keyof typeof statusConfig] || statusConfig.NEGOTIATION;
                return (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.id}`}
                    className="flex items-center justify-between p-4 hover:bg-nexus-50 dark:hover:bg-nexus-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-nexus-100 dark:bg-nexus-800 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-nexus-600 dark:text-nexus-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-nexus-900 dark:text-nexus-100 truncate">{deal.title}</p>
                        <div className="flex items-center gap-2 text-xs text-nexus-500 dark:text-nexus-400">
                          <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
                          <span>•</span>
                          <span>{deal.updated}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-nexus-900 dark:text-nexus-100">{deal.price}</p>
                      <p className="text-xs text-nexus-500 dark:text-nexus-400">{deal.type.replace('_', ' — ').toLowerCase()}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}