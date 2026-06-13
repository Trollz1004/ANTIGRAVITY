'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { Filters } from '@/components/marketplace/Filters';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Building2, Briefcase, Handshake, Gem, Loader2 } from 'lucide-react';

const typeOptions = [
  { value: 'SERVICE', label: 'Service', icon: Briefcase },
  { value: 'PROJECT', label: 'Project', icon: Building2 },
  { value: 'REFERRAL', label: 'Referral', icon: Handshake },
  { value: 'BUSINESS_SALE', label: 'Business — for sale', icon: Building2 },
  { value: 'ASSET_SALE', label: 'Asset — list, domain, IP', icon: Gem },
];

export default function ExplorePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchListings();
  }, [pagination.page, filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...filters,
      });
      const res = await fetch(`/api/listings?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const typeIcons = {
    SERVICE: Briefcase,
    PROJECT: Building2,
    REFERRAL: Handshake,
    BUSINESS_SALE: Building2,
    ASSET_SALE: Gem,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Explore Marketplace</h1>
          <p className="text-nexus-500 dark:text-nexus-400 mt-1">Discover services, projects, referrals, and business opportunities</p>
        </div>
        <Link href="/dashboard/listings/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Filters initialFilters={filters} onChange={handleFilterChange} />
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} variant="outlined" className="animate-pulse h-64" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card variant="outlined" className="py-16 text-center">
          <Search className="w-12 h-12 mx-auto text-nexus-400 mb-4" />
          <h3 className="text-lg font-medium text-nexus-900 dark:text-nexus-100 mb-2">
            No listings found
          </h3>
          <p className="text-nexus-500 dark:text-nexus-400 mb-6">
            Try adjusting your filters or search terms
          </p>
          <Button variant="outline" onClick={() => { setFilters({}); setPagination(p => ({ ...p, page: 1 })); }}>
            Clear Filters
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <Card variant="outlined" padding="none">
          <Table
            columns={[
              { key: 'type', header: 'Type', render: (row) => (
                <Badge variant="primary" dot>
                  {typeOptions.find(o => o.value === row.type)?.label || row.type}
                </Badge>
              )},
              { key: 'title', header: 'Title', className: 'max-w-xs' },
              { key: 'org.name', header: 'Seller' },
              { key: 'pricing', header: 'Price', render: (row) => {
                const p = row.pricing;
                if (!p) return '-';
                if (p.model === 'FIXED') return formatCurrency(p.amount);
                if (p.model === 'RANGE') return `${formatCurrency(p.minAmount)} - ${formatCurrency(p.maxAmount)}`;
                if (p.model === 'AUCTION') return 'Auction';
                return 'LOI Only';
              }},
              { key: 'status', header: 'Status', render: (row) => (
                <Badge variant={row.status === 'PUBLISHED' ? 'success' : row.status === 'DRAFT' ? 'default' : 'warning'} size="sm">
                  {row.status}
                </Badge>
              )},
              { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() },
            ]}
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
      )}

      {/* Type Legend */}
      <Card variant="outlined" padding="md">
        <h3 className="font-medium text-nexus-900 dark:text-nexus-100 mb-3">Listing Types</h3>
        <div className="flex flex-wrap gap-3">
          {typeOptions.map(({ value, label, icon: Icon }) => (
            <Badge key={value} variant="default" dot>
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}