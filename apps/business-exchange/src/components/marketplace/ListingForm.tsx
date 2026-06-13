'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const listingSchema = z.object({
  type: z.enum(['SERVICE', 'PROJECT', 'REFERRAL', 'BUSINESS_SALE', 'ASSET_SALE']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  pricing: z.object({
    model: z.enum(['FIXED', 'RANGE', 'AUCTION', 'LOI_ONLY']),
    amount: z.number().positive().optional(),
    minAmount: z.number().positive().optional(),
    maxAmount: z.number().positive().optional(),
    currency: z.string().default('USD'),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(data => {
  if (!data.pricing) return true;
  if (data.pricing.model === 'FIXED' && !data.pricing.amount) return false;
  if (data.pricing.model === 'RANGE' && (!data.pricing.minAmount || !data.pricing.maxAmount)) return false;
  return true;
}, {
  message: 'Please fill in the required pricing fields for the selected model',
  path: ['pricing'],
});

type ListingFormData = z.infer<typeof listingSchema>;

const typeOptions: SelectOption[] = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'BUSINESS_SALE', label: 'Business — for sale' },
  { value: 'ASSET_SALE', label: 'Asset — list, domain, IP' },
];

const pricingModels: SelectOption[] = [
  { value: 'FIXED', label: 'Fixed price' },
  { value: 'RANGE', label: 'Price range' },
  { value: 'AUCTION', label: 'Auction' },
  { value: 'LOI_ONLY', label: 'LOI only (no price disclosed)' },
];

interface ListingFormProps {
  onSubmit: (data: ListingFormData) => Promise<void>;
  initialData?: Partial<ListingFormData>;
  isLoading?: boolean;
}

export function ListingForm({ onSubmit, initialData, isLoading = false }: ListingFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Type & Basics', 'Pricing', 'Details', 'Review'];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      type: 'SERVICE',
      title: '',
      description: '',
      pricing: { model: 'FIXED', currency: 'USD' },
      metadata: {},
      ...initialData,
    },
  });

  const watchedType = watch('type');
  const watchedPricingModel = watch('pricing.model');

  const handleNext = () => setActiveStep(s => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-6">
            <Select
              label="Listing Type"
              error={errors.type?.message}
              options={typeOptions}
              {...register('type')}
            />
            <Input
              label="Title"
              error={errors.title?.message}
              placeholder="Enter a clear, descriptive title"
              {...register('title')}
            />
            <Textarea
              label="Description"
              error={errors.description?.message}
              placeholder="Describe what you're offering or seeking in detail..."
              rows={6}
              {...register('description')}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <Select
              label="Pricing Model"
              error={errors.pricing?.message}
              options={pricingModels}
              {...register('pricing.model')}
            />
            {watchedPricingModel === 'FIXED' && (
              <Input
                label="Price (USD)"
                type="number"
                error={errors.pricing?.message}
                placeholder="e.g., 5000"
                {...register('pricing.amount', { valueAsNumber: true })}
              />
            )}
            {watchedPricingModel === 'RANGE' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Minimum Price (USD)"
                  type="number"
                  placeholder="e.g., 3000"
                  {...register('pricing.minAmount', { valueAsNumber: true })}
                />
                <Input
                  label="Maximum Price (USD)"
                  type="number"
                  placeholder="e.g., 10000"
                  {...register('pricing.maxAmount', { valueAsNumber: true })}
                />
              </div>
            )}
            {watchedPricingModel === 'AUCTION' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Auction listings will accept bids. Set a reserve price in metadata if needed.
                </p>
              </div>
            )}
            {watchedPricingModel === 'LOI_ONLY' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Price will be negotiated privately. Interested parties submit LOIs.
                </p>
              </div>
            )}
            <Input
              label="Currency"
              {...register('pricing.currency')}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-medium text-nexus-700 dark:text-nexus-300">Type-specific fields for {watchedType}</h4>
            {watchedType === 'SERVICE' && (
              <div className="space-y-4">
                <Input label="Delivery Timeline" placeholder="e.g., 2-4 weeks" {...register('metadata.deliveryTimeline')} />
                <Input label="Scope" placeholder="e.g., Full implementation" {...register('metadata.scope')} />
                <Select
                  label="Engagement Type"
                  options={[
                    { value: 'fixed', label: 'Fixed Scope' },
                    { value: 'retainer', label: 'Retainer' },
                    { value: 'hourly', label: 'Hourly' },
                  ]}
                  {...register('metadata.engagementType')}
                />
              </div>
            )}
            {watchedType === 'PROJECT' && (
              <div className="space-y-4">
                <Input label="Project Duration" placeholder="e.g., 3 months" {...register('metadata.duration')} />
                <Input label="Team Size Needed" placeholder="e.g., 2-3 developers" {...register('metadata.teamSize')} />
                <Textarea label="Deliverables" placeholder="List key deliverables..." rows={4} {...register('metadata.deliverables')} />
              </div>
            )}
            {watchedType === 'REFERRAL' && (
              <div className="space-y-4">
                <Input label="Commission Rate (%)" type="number" placeholder="e.g., 10" {...register('metadata.commissionRate', { valueAsNumber: true })} />
                <Textarea label="Referral Criteria" placeholder="What qualifies as a successful referral..." rows={3} {...register('metadata.criteria')} />
              </div>
            )}
            {watchedType === 'BUSINESS_SALE' && (
              <div className="space-y-4">
                <Input label="Annual Revenue (USD)" type="number" placeholder="e.g., 500000" {...register('metadata.revenue', { valueAsNumber: true })} />
                <Input label="Annual Profit (USD)" type="number" placeholder="e.g., 150000" {...register('metadata.profit', { valueAsNumber: true })} />
                <Input label="Employees" type="number" placeholder="e.g., 5" {...register('metadata.employees', { valueAsNumber: true })} />
                <Input label="Industry/Niche" placeholder="e.g., SaaS, E-commerce" {...register('metadata.industry')} />
                <Textarea label="Assets Included" placeholder="Domain, IP, customer list, codebase..." rows={3} {...register('metadata.assetsIncluded')} />
              </div>
            )}
            {watchedType === 'ASSET_SALE' && (
              <div className="space-y-4">
                <Select
                  label="Asset Type"
                  options={[
                    { value: 'domain', label: 'Domain' },
                    { value: 'ip', label: 'Intellectual Property' },
                    { value: 'list', label: 'Email/List' },
                    { value: 'code', label: 'Codebase/Repository' },
                    { value: 'other', label: 'Other' },
                  ]}
                  {...register('metadata.assetType')}
                />
                <Textarea label="Description" placeholder="Detailed description of the asset..." rows={3} {...register('metadata.assetDescription')} />
                <Input label="Traffic/Users (monthly)" placeholder="e.g., 10,000 visits" {...register('metadata.traffic')} />
              </div>
            )}
          </div>
        );
      case 3:
        const formData = watch();
        return (
          <div className="space-y-6">
            <Card variant="outlined" className="space-y-4">
              <h4 className="font-medium text-nexus-900 dark:text-nexus-100">Review Your Listing</h4>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-nexus-500 dark:text-nexus-400">Type</dt>
                  <dd className="font-medium">{typeOptions.find(o => o.value === formData.type)?.label}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-nexus-500 dark:text-nexus-400">Title</dt>
                  <dd className="font-medium">{formData.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-nexus-500 dark:text-nexus-400">Pricing</dt>
                  <dd className="font-medium">
                    {formData.pricing?.model === 'FIXED' && `$${formData.pricing.amount?.toLocaleString()}`}
                    {formData.pricing?.model === 'RANGE' && `$${formData.pricing.minAmount?.toLocaleString()} - $${formData.pricing.maxAmount?.toLocaleString()}`}
                    {formData.pricing?.model === 'AUCTION' && 'Auction'}
                    {formData.pricing?.model === 'LOI_ONLY' && 'LOI Only'}
                  </dd>
                </div>
              </dl>
            </Card>
            <div className="p-4 bg-nexus-50 dark:bg-nexus-900/50 border border-nexus-200 dark:border-nexus-800 rounded-lg">
              <p className="text-sm text-nexus-600 dark:text-nexus-400">
                By submitting, you agree to our Terms of Service. Listings are reviewed before publishing.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress indicator */}
      <div className="hidden md:flex items-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                index < activeStep
                  ? 'bg-hydra-600 text-white'
                  : index === activeStep
                  ? 'bg-hydra-100 text-hydra-700 dark:bg-hydra-900/30 dark:text-hydra-400'
                  : 'bg-nexus-200 text-nexus-500 dark:bg-nexus-700 dark:text-nexus-400'
              )}
            >
              {index < activeStep ? <span className="w-4 h-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-2',
                  index < activeStep ? 'bg-hydra-600' : 'bg-nexus-200 dark:bg-nexus-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden mb-6 flex items-center justify-between">
        <span className="text-sm text-nexus-500 dark:text-nexus-400">
          Step {activeStep + 1} of {steps.length}
        </span>
        <span className="text-sm font-medium text-nexus-900 dark:text-nexus-100">{steps[activeStep]}</span>
      </div>

      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-nexus-200 dark:border-nexus-800">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <div className="flex gap-3">
          {activeStep < steps.length - 1 ? (
            <Button type="button" variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" loading={isLoading}>
              Create Listing
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}