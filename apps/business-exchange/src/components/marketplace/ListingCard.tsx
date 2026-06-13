'use client';

import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ExternalLink, ArrowRight, Building2, Briefcase, Handshake, Gem } from 'lucide-react';

interface ListingCardProps {
  listing: {
    id: string;
    type: string;
    title: string;
    description: string;
    pricing: Record<string, unknown>;
    metadata: Record<string, unknown>;
    status: string;
    createdAt: string;
    org: { id: string; name: string; slug: string };
  };
  compact?: boolean;
}

const typeConfig = {
  SERVICE: { icon: Briefcase, label: 'Service', color: 'primary' as const },
  PROJECT: { icon: Building2, label: 'Project', color: 'info' as const },
  REFERRAL: { icon: Handshake, label: 'Referral', color: 'success' as const },
  BUSINESS_SALE: { icon: Building2, label: 'Business — for sale', color: 'warning' as const },
  ASSET_SALE: { icon: Gem, label: 'Asset — list, domain, IP', color: 'default' as const },
} as const;

export function ListingCard({ listing, compact = false }: ListingCardProps) {
  const config = typeConfig[listing.type as keyof typeof typeConfig] || typeConfig.SERVICE;
  const Icon = config.icon;
  
  const pricing = listing.pricing as { model?: string; amount?: number; minAmount?: number; maxAmount?: number; currency?: string } | undefined;
  let priceDisplay = '';
  if (pricing) {
    const currency = pricing.currency || 'USD';
    if (pricing.model === 'FIXED' && pricing.amount) {
      priceDisplay = formatCurrency(pricing.amount, currency);
    } else if (pricing.model === 'RANGE' && pricing.minAmount && pricing.maxAmount) {
      priceDisplay = `${formatCurrency(pricing.minAmount, currency)} - ${formatCurrency(pricing.maxAmount, currency)}`;
    } else if (pricing.model === 'AUCTION') {
      priceDisplay = 'Auction';
    } else if (pricing.model === 'LOI_ONLY') {
      priceDisplay = 'LOI only';
    }
  }

  return (
    <Card variant="outlined" padding={compact ? 'sm' : 'md'} className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={config.color} dot>{config.label}</Badge>
          {listing.status !== 'PUBLISHED' && (
            <Badge variant="default" size="sm">{listing.status}</Badge>
          )}
        </div>
      </div>

      <Link href={`/dashboard/listings/${listing.id}`} className="group">
        <h3 className="font-semibold text-nexus-900 dark:text-nexus-100 group-hover:text-hydra-600 dark:group-hover:text-hydra-400 transition-colors mb-2 line-clamp-2">
          {listing.title}
        </h3>
      </Link>

      <p className="text-sm text-nexus-600 dark:text-nexus-400 line-clamp-3 mb-4 flex-1">
        {listing.description}
      </p>

      {priceDisplay && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-nexus-900 dark:text-nexus-100 font-mono">
            {priceDisplay}
          </span>
          {pricing?.model === 'RANGE' && (
            <span className="text-xs text-nexus-500 dark:text-nexus-400">({pricing.model})</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-nexus-200 dark:border-nexus-800">
        <Link
          href={`/dashboard/listings/${listing.id}`}
          className="text-sm text-hydra-600 dark:text-hydra-400 hover:underline font-medium flex items-center gap-1"
        >
          View details
          <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-xs text-nexus-500 dark:text-nexus-400">
          by {listing.org.name}
        </span>
      </div>
    </Card>
  );
}