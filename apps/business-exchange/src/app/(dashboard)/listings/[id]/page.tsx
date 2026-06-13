'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Building2, Briefcase, Handshake, Gem, DollarSign, Clock, Calendar, User, ExternalLink, ArrowRight, MessageSquare, Shield, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';

const typeConfig = {
  SERVICE: { label: 'Service', icon: Briefcase, color: 'primary' },
  PROJECT: { label: 'Project', icon: Building2, color: 'info' },
  REFERRAL: { label: 'Referral', icon: Handshake, color: 'success' },
  BUSINESS_SALE: { label: 'Business — for sale', icon: Building2, color: 'warning' },
  ASSET_SALE: { label: 'Asset — list, domain, IP', icon: Gem, color: 'default' },
} as const;

const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'default' as const },
  PUBLISHED: { label: 'Published', variant: 'success' as const },
  ARCHIVED: { label: 'Archived', variant: 'warning' as const },
  SOLD: { label: 'Sold/Closed', variant: 'info' as const },
} as const;

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setListing(data.listing);
      } else if (res.status === 404) {
        setError('Listing not found');
      } else {
        setError('Failed to load listing');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card variant="outlined" className="animate-pulse h-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card variant="outlined" className="animate-pulse h-64 lg:col-span-2" />
          <Card variant="outlined" className="animate-pulse h-64" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100 mb-2">{error || 'Listing not found'}</h1>
        <Link href="/dashboard/explore">
          <Button variant="primary">Browse Marketplace</Button>
        </Link>
      </div>
    );
  }

  const config = typeConfig[listing.type as keyof typeof typeConfig] || typeConfig.SERVICE;
  const statusCfg = statusConfig[listing.status as keyof typeof statusConfig] || statusConfig.DRAFT;
  const Icon = config.icon;
  const pricing = listing.pricing as any;

  let priceDisplay = '';
  if (pricing) {
    if (pricing.model === 'FIXED' && pricing.amount) priceDisplay = formatCurrency(pricing.amount, pricing.currency);
    else if (pricing.model === 'RANGE' && pricing.minAmount && pricing.maxAmount) priceDisplay = `${formatCurrency(pricing.minAmount, pricing.currency)} - ${formatCurrency(pricing.maxAmount, pricing.currency)}`;
    else if (pricing.model === 'AUCTION') priceDisplay = 'Auction';
    else if (pricing.model === 'LOI_ONLY') priceDisplay = 'LOI Only';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={config.color} dot size="lg">
            <Icon className="w-4 h-4 mr-1" />
            {config.label}
          </Badge>
          <Badge variant={statusCfg.variant} size="lg">{statusCfg.label}</Badge>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/explore">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 mr-1" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card variant="outlined" padding="lg">
            <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100 mb-4">{listing.title}</h1>
            <div className="prose dark:prose-invert max-w-none text-nexus-700 dark:text-nexus-300 whitespace-pre-wrap">
              {listing.description}
            </div>
          </Card>

          {/* Details Grid */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {priceDisplay && (
                <div className="flex items-center gap-3 p-4 bg-hydra-50 dark:bg-hydra-900/20 border border-hydra-200 dark:border-hydra-800 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-hydra-600 dark:text-hydra-400" />
                  </div>
                  <div>
                    <p className="text-sm text-nexus-500 dark:text-nexus-400">Price</p>
                    <p className="text-xl font-bold text-nexus-900 dark:text-nexus-100 font-mono">{priceDisplay}</p>
                    {pricing.model && <p className="text-xs text-nexus-500 dark:text-nexus-400 capitalize">{pricing.model.toLowerCase().replace('_', ' ')}</p>}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-nexus-50 dark:bg-nexus-900/50 border border-nexus-200 dark:border-nexus-800 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-nexus-100 dark:bg-nexus-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-nexus-500" />
                </div>
                <div>
                  <p className="text-sm text-nexus-500 dark:text-nexus-400">Listed</p>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">{formatDate(listing.publishedAt || listing.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-nexus-50 dark:bg-nexus-900/50 border border-nexus-200 dark:border-nexus-800 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-nexus-100 dark:bg-nexus-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-nexus-500" />
                </div>
                <div>
                  <p className="text-sm text-nexus-500 dark:text-nexus-400">Seller</p>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">{listing.org.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-nexus-50 dark:bg-nexus-900/50 border border-nexus-200 dark:border-nexus-800 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-nexus-100 dark:bg-nexus-800 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-nexus-500" />
                </div>
                <div>
                  <p className="text-sm text-nexus-500 dark:text-nexus-400">Views</p>
                  <p className="font-medium text-nexus-900 dark:text-nexus-100">—</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Metadata / Type-specific fields */}
          {listing.metadata && Object.keys(listing.metadata).length > 0 && (
            <Card variant="outlined" padding="lg">
              <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Additional Information</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                {Object.entries(listing.metadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <dt className="text-sm text-nexus-500 dark:text-nexus-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                    <dd className="text-nexus-900 dark:text-nexus-100">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller Card */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Seller</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-hydra-600 dark:text-hydra-400" />
              </div>
              <div>
                <p className="font-medium text-nexus-900 dark:text-nexus-100">{listing.org.name}</p>
                <p className="text-sm text-nexus-500 dark:text-nexus-400">{listing.org.type}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-nexus-600 dark:text-nexus-400">
              <p>Member since {formatDate(listing.org.createdAt)}</p>
              <p>{listing.org.slug}</p>
            </div>
            <Button variant="outline" className="w-full mt-4">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Seller
            </Button>
          </Card>

          {/* Actions */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Actions</h3>
            <div className="space-y-3">
              <Button className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Initiate Inquiry
              </Button>
              <Button variant="outline" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Request Verification
              </Button>
              <Button variant="ghost" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share Listing
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 mb-4">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-nexus-500 dark:text-nexus-400">Inquiries</span>
                <span className="font-medium text-nexus-900 dark:text-nexus-100">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-nexus-500 dark:text-nexus-400">Offers Received</span>
                <span className="font-medium text-nexus-900 dark:text-nexus-100">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-nexus-500 dark:text-nexus-400">Watchers</span>
                <span className="font-medium text-nexus-900 dark:text-nexus-100">—</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}