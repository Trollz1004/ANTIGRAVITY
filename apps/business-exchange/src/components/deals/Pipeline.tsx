'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, GripVertical, ChevronLeft, ChevronRight, ExternalLink, DollarSign, Building2, Briefcase, Handshake, Gem } from 'lucide-react';
import { useState } from 'react';

interface Deal {
  id: string;
  listing: {
    id: string;
    title: string;
    type: string;
    pricing: Record<string, unknown>;
  };
  buyerOrg: { id: string; name: string };
  sellerOrg: { id: string; name: string };
  status: string;
  agreedPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PipelineColumnProps {
  status: string;
  title: string;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onAddDeal?: (status: string) => void;
}

const statusConfig = {
  NEGOTIATION: { label: 'Negotiation', color: 'primary', icon: Handshake },
  CONTRACT_SIGNED: { label: 'Contract Signed', color: 'success', icon: DollarSign },
  COMPLETED: { label: 'Completed', color: 'info', icon: Building2 },
  ARCHIVED: { label: 'Archived', color: 'default', icon: Gem },
} as const;

const statusOrder = ['NEGOTIATION', 'CONTRACT_SIGNED', 'COMPLETED', 'ARCHIVED'];

const typeIcons = {
  SERVICE: Briefcase,
  PROJECT: Building2,
  REFERRAL: Handshake,
  BUSINESS_SALE: Building2,
  ASSET_SALE: Gem,
} as const;

function PipelineColumn({ status, title, deals, onDealClick, onAddDeal }: PipelineColumnProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NEGOTIATION;
  const Icon = config.icon;

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-nexus-100 dark:bg-nexus-900 rounded-lg p-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', `text-${config.color}-600 dark:text-${config.color}-400`)} />
          <h3 className="font-semibold text-nexus-900 dark:text-nexus-100">{config.label}</h3>
        </div>
        <Badge variant="default" size="sm">{deals.length}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[400px]" role="list" aria-label={`${config.label} deals`}>
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
        ))}
        {onAddDeal && (
          <button
            onClick={() => onAddDeal(status)}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-nexus-300 dark:border-nexus-700 rounded-lg text-nexus-500 dark:text-nexus-400 hover:border-hydra-500 hover:text-hydra-600 dark:hover:text-hydra-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Deal
          </button>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, onClick }: { deal: Deal; onClick: (deal: Deal) => void }) {
  const Icon = typeIcons[deal.listing.type as keyof typeof typeIcons] || Briefcase;
  const pricing = deal.listing.pricing as { model?: string; amount?: number } | undefined;
  let priceStr = '';
  if (pricing?.model === 'FIXED' && pricing.amount) {
    priceStr = `$${pricing.amount.toLocaleString()}`;
  } else if (deal.agreedPrice) {
    priceStr = `$${deal.agreedPrice.toLocaleString()}`;
  }

  return (
    <div
      onClick={() => onClick(deal)}
      className="bg-white dark:bg-nexus-950 border border-nexus-200 dark:border-nexus-800 rounded-lg p-3 hover:shadow-md hover:border-hydra-300 dark:hover:border-hydra-700 transition-all cursor-pointer group"
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(deal); }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="default" size="sm" dot>
          {deal.listing.type.replace('_', ' — ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </Badge>
        <GripVertical className="w-4 h-4 text-nexus-400 opacity-0 group-hover:opacity-100 cursor-grab" />
      </div>

      <h4 className="font-medium text-nexus-900 dark:text-nexus-100 mb-1 line-clamp-1">
        {deal.listing.title}
      </h4>

      {priceStr && (
        <p className="text-sm font-bold text-hydra-600 dark:text-hydra-400 font-mono mb-2">
          {priceStr}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-nexus-500 dark:text-nexus-400">
        <span className="truncate max-w-[140px]">{deal.buyerOrg.name}</span>
        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="truncate max-w-[140px] text-right">{deal.sellerOrg.name}</span>
      </div>
    </div>
  );
}

interface PipelineProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onAddDeal?: (status: string) => void;
}

export function Pipeline({ deals, onDealClick, onAddDeal }: PipelineProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');

  const groupedDeals = statusOrder.reduce((acc, status) => {
    acc[status] = deals.filter(d => d.status === status);
    return acc;
  }, {} as Record<string, Deal[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-nexus-900 border border-nexus-200 dark:border-nexus-800 rounded-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-nexus-900 dark:text-nexus-100">Deal Pipeline</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-nexus-300 dark:border-nexus-600 rounded-lg bg-white dark:bg-nexus-900 text-nexus-900 dark:text-nexus-100 focus:outline-none focus:ring-2 focus:ring-hydra-500"
          >
            <option value="all">All Stages</option>
            {statusOrder.map(s => (
              <option key={s} value={s}>{statusConfig[s as keyof typeof statusConfig].label}</option>
            ))}
          </select>
        </div>
        {onAddDeal && (
          <Button onClick={() => onAddDeal('NEGOTIATION')}>
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        )}
      </div>

      {/* Pipeline Columns */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max" role="tablist" aria-label="Deal pipeline stages">
          {statusOrder.map((status) => (
            <div key={status} role="tabpanel" aria-label={statusConfig[status as keyof typeof statusConfig].label}>
              <PipelineColumn
                status={status}
                title={statusConfig[status as keyof typeof statusConfig].label}
                deals={groupedDeals[status] || []}
                onDealClick={onDealClick}
                onAddDeal={onAddDeal}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}