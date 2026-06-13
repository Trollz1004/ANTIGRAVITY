'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Filter, SlidersHorizontal } from 'lucide-react';

interface FiltersProps {
  initialFilters?: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
  className?: string;
}

const typeOptions: SelectOption[] = [
  { value: '', label: 'All Types' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'BUSINESS_SALE', label: 'Business — for sale' },
  { value: 'ASSET_SALE', label: 'Asset — list, domain, IP' },
];

const statusOptions: SelectOption[] = [
  { value: '', label: 'All Status' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'SOLD', label: 'Sold/Closed' },
];

const sortOptions: SelectOption[] = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'title:asc', label: 'Title A-Z' },
];

export function Filters({ initialFilters = {}, onChange, className }: FiltersProps) {
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    // Remove empty values
    Object.keys(newFilters).forEach(k => {
      if (!newFilters[k]) delete newFilters[k];
    });
    setFilters(newFilters);
    onChange(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== '');

  return (
    <div className={cn('bg-white dark:bg-nexus-900 border border-nexus-200 dark:border-nexus-800 rounded-lg p-4 sm:p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-nexus-900 dark:text-nexus-100 flex items-center gap-2">
          <Filter className="w-5 h-5 text-hydra-600" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => {
            setFilters({});
            onChange({});
          }}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Primary Filters - Always visible */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Select
          label="Type"
          options={typeOptions}
          value={filters.type || ''}
          onChange={(e) => handleChange('type', e.target.value)}
          placeholder="All Types"
        />
        <Select
          label="Status"
          options={statusOptions}
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          placeholder="All Status"
        />
        <Select
          label="Sort By"
          options={sortOptions}
          value={filters.sort || 'createdAt:desc'}
          onChange={(e) => handleChange('sort', e.target.value)}
        />
        <Input
          label="Search"
          placeholder="Keywords..."
          value={filters.q || ''}
          onChange={(e) => handleChange('q', e.target.value)}
        />
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full sm:w-auto"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced Filters'}
      </Button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in slide-in-from-top-2 duration-200">
          <Input
            label="Min Price"
            type="number"
            placeholder="e.g., 1000"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value)}
          />
          <Input
            label="Max Price"
            type="number"
            placeholder="e.g., 100000"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
          />
          <Input
            label="Location"
            placeholder="City, State or Remote"
            value={filters.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
          <Select
            label="Currency"
            options={[
              { value: '', label: 'All Currencies' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
            ]}
            value={filters.currency || ''}
            onChange={(e) => handleChange('currency', e.target.value)}
          />
          <Select
            label="Engagement Type"
            options={[
              { value: '', label: 'All Types' },
              { value: 'fixed', label: 'Fixed Scope' },
              { value: 'retainer', label: 'Retainer' },
              { value: 'hourly', label: 'Hourly' },
            ]}
            value={filters.engagementType || ''}
            onChange={(e) => handleChange('engagementType', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}