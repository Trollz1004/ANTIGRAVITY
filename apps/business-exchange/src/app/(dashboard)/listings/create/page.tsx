'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingForm } from '@/components/marketplace/ListingForm';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function CreateListingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        router.push(`/dashboard/listings/${result.listing.id}`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create listing');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Create Listing</h1>
        <p className="text-nexus-500 dark:text-nexus-400 mt-1">
          Post a service, project, referral, or business opportunity
        </p>
      </div>

      <Card variant="outlined" padding="lg">
        <ListingForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}