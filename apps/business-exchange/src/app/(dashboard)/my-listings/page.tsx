'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, ExternalLink, Loader2, DollarSign, Building2, Briefcase, Handshake, Gem } from 'lucide-react';

const typeIcons = {
  SERVICE: Briefcase,
  PROJECT: Building2,
  REFERRAL: Handshake,
  BUSINESS_SALE: Building2,
  ASSET_SALE: Gem,
};

const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'default' as const },
  PUBLISHED: { label: 'Published', variant: 'success' as const },
  ARCHIVED: { label: 'Archived', variant: 'warning' as const },
  SOLD: { label: 'Sold/Closed', variant: 'info' as const },
} as const;

export default function MyListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchListings();
  }, [pagination.page]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/listings?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
        setPagination(data.pagination);
      }
    } catch {
      console.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        fetchListings();
      }
    } catch {
      console.error('Failed to delete listing');
    }
  };

  const columns = [
    { key: 'type', header: 'Type', render: (row: any) => {
      const Icon = typeIcons[row.type as keyof typeof typeIcons] || Briefcase;
      return (
        <Badge variant="primary" dot>
          <Icon className="w-3 h-3 mr-1" />
          {row.type.replace('_', ' — ')}
        </Badge>
      );
    }},
    { key: 'title', header: 'Title', className: 'max-w-xs' },
    { key: 'status', header: 'Status', render: (row: any) => {
      const cfg = statusConfig[row.status as keyof typeof statusConfig] || statusConfig.DRAFT;
      return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
    }},
    { key: 'pricing', header: 'Price', render: (row: any) => {
      const p = row.pricing;
      if (!p) return '-';
      if (p.model === 'FIXED') return <span className="font-mono font-medium">${p.amount?.toLocaleString()}</span>;
      if (p.model === 'RANGE') return <span className="font-mono font-medium">${p.minAmount?.toLocaleString()} - ${p.maxAmount?.toLocaleString()}</span>;
      if (p.model === 'AUCTION') return 'Auction';
      return 'LOI Only';
    }},
    { key: 'createdAt', header: 'Created', render: (row: any) => formatDate(row.createdAt) },
    { key: 'actions', header: 'Actions', render: (row: any) => (
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/listings/${row.id}`} className="p-2 hover:bg-nexus-100 dark:hover:bg-nexus-800 rounded-lg" title="View">
          <Eye className="w-4 h-4 text-nexus-500" />
        </Link>
        <Link href={`/dashboard/listings/${row.id}/edit`} className="p-2 hover:bg-nexus-100 dark:hover:bg-nexus-800 rounded-lg" title="Edit">
          <Edit className="w-4 h-4 text-nexus-500" />
        </Link>
        <button onClick={() => handleDelete(row.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">My Listings</h1>
          <p className="text-nexus-500 dark:text-nexus-400 mt-1">Manage your marketplace listings</p>
        </div>
        <Link href="/dashboard/listings/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card variant="outlined" className="animate-pulse h-[400px]" />
      ) : listings.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Plus className="w-16 h-16 mx-auto text-nexus-400 mb-4" />
          <h3 className="text-lg font-medium text-nexus-900 dark:text-nexus-100 mb-2">No listings yet</h3>
          <p className="text-nexus-500 dark:text-nexus-400 mb-6">Create your first listing to get started</p>
          <Link href="/dashboard/listings/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card variant="outlined" padding="none">
            <Table
              columns={columns}
              data={listings}
              keyField="id"
              hoverable
            />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination(p => ({ ...p, page }))}
              pageSize={pagination.limit}
              onPageSizeChange={(size) => setPagination(p => ({ ...p, limit: size, page: 1 }))}
              showPageSize
            />
          </Card>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Listings', value: pagination.total },
              { label: 'Published', value: listings.filter(l => l.status === 'PUBLISHED').length },
              { label: 'Drafts', value: listings.filter(l => l.status === 'DRAFT').length },
              { label: 'Archived', value: listings.filter(l => l.status === 'ARCHIVED').length },
            ].map((stat, i) => (
              <Card key={i} variant="outlined" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-hydra-600 dark:text-hydra-400" />
                </div>
                <div>
                  <p className="text-sm text-nexus-500 dark:text-nexus-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}