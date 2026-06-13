'use client';

import { useEffect, useState } from 'react';
import { Pipeline } from '@/components/deals/Pipeline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

interface Deal {
  id: string;
  listing: { id: string; title: string; type: string; pricing: Record<string, unknown> };
  buyerOrg: { id: string; name: string };
  sellerOrg: { id: string; name: string };
  status: string;
  agreedPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDealClick = (deal: Deal) => {
    // Navigate to deal detail or open modal
    console.log('Deal clicked:', deal);
  };

  const handleAddDeal = (status: string) => {
    // Navigate to create deal with preselected status
    console.log('Add deal for status:', status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Deal Pipeline</h1>
          <p className="text-nexus-500 dark:text-nexus-400 mt-1">Manage your active deals across all stages</p>
        </div>
        <Button onClick={() => console.log('New deal')}>
          <Plus className="w-4 h-4 mr-2" />
          New Deal
        </Button>
      </div>

      {loading ? (
        <Card variant="outlined" className="animate-pulse h-[600px]" />
      ) : (
        <Pipeline deals={deals} onDealClick={handleDealClick} onAddDeal={handleAddDeal} />
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Deals', value: deals.length, icon: 'FileText' },
          { label: 'In Negotiation', value: deals.filter(d => d.status === 'NEGOTIATION').length, icon: 'Handshake' },
          { label: 'Contract Signed', value: deals.filter(d => d.status === 'CONTRACT_SIGNED').length, icon: 'DollarSign' },
          { label: 'Completed', value: deals.filter(d => d.status === 'COMPLETED').length, icon: 'Building2' },
        ].map((stat, i) => (
          <Card key={i} variant="outlined" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
              <span className="text-hydra-600 dark:text-hydra-400 text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm text-nexus-500 dark:text-nexus-400">{stat.label}</p>
              <p className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}