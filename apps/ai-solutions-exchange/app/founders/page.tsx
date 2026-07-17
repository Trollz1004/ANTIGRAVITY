'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Building2,
  MapPin,
  TrendingUp,
  DollarSign,
  Search,
  SlidersHorizontal,
  X,
  ArrowRight,
  Rocket,
  Users,
} from 'lucide-react';

interface Founder {
  id: string;
  name: string;
  company: string;
  sector: string;
  stage: string;
  raiseAmount: number;
  location: string;
  tagline: string;
  description: string;
  foundedAt: string;
  teamSize: number;
  revenue: string;
  lookingFor: string[];
}

const FOUNDERS: Founder[] = [
  {
    id: 'f-1',
    name: 'Sarah Chen',
    company: 'NeuralScale',
    sector: 'AI Infrastructure',
    stage: 'Seed',
    raiseAmount: 2500000,
    location: 'San Francisco, CA',
    tagline: 'Elastic GPU clusters for fine-tuning at 10x lower cost.',
    description:
      'NeuralScale abstracts heterogeneous GPU providers into a single autoscaled training plane with spot-instance fallback and checkpoint-aware scheduling.',
    foundedAt: '2025-03-15',
    teamSize: 7,
    revenue: 'Pre-revenue',
    lookingFor: ['Seed lead', 'Cloud credits', 'ML advisors'],
  },
  {
    id: 'f-2',
    name: 'Marcus Johnson',
    company: 'PolicyLens',
    sector: 'Enterprise AI',
    stage: 'Series A',
    raiseAmount: 8000000,
    location: 'New York, NY',
    tagline: 'Compliance copilot for regulated industries.',
    description:
      'PolicyLens maps internal policies against live regulations, flags drift, and drafts remediation workflows for banks, insurers, and health systems.',
    foundedAt: '2023-09-10',
    teamSize: 24,
    revenue: '$1.2M ARR',
    lookingFor: ['Series A lead', 'Enterprise design partners'],
  },
  {
    id: 'f-3',
    name: 'Aisha Patel',
    company: 'FarmSignal',
    sector: 'Climate / AgTech',
    stage: 'Pre-seed',
    raiseAmount: 750000,
    location: 'Austin, TX',
    tagline: 'Computer-vision crop diagnostics for smallholder farms.',
    description:
      'FarmSignal turns low-bandwidth phone footage into early pest, disease, and irrigation alerts delivered via SMS and WhatsApp.',
    foundedAt: '2026-01-20',
    teamSize: 3,
    revenue: 'Pre-revenue',
    lookingFor: ['Pre-seed lead', 'AgTech mentors', 'Pilot customers'],
  },
  {
    id: 'f-4',
    name: 'David Kim',
    company: 'CipherMind',
    sector: 'Cybersecurity',
    stage: 'Seed',
    raiseAmount: 4000000,
    location: 'Seattle, WA',
    tagline: 'Autonomous red-teaming for AI agents.',
    description:
      'CipherMind runs continuous adversarial simulations against LLM-powered apps to uncover prompt injection, data-exfiltration, and privilege-escalation risks.',
    foundedAt: '2024-06-01',
    teamSize: 9,
    revenue: '$300k ARR',
    lookingFor: ['Seed lead', 'Security GTM hire'],
  },
  {
    id: 'f-5',
    name: 'Elena Rossi',
    company: 'LexiFlow',
    sector: 'Legal Tech',
    stage: 'Series A',
    raiseAmount: 12000000,
    location: 'London, UK',
    tagline: 'Agentic contract negotiation for procurement teams.',
    description:
      'LexiFlow drafts counter-proposals, tracks clause playbooks, and resolves objections across Salesforce, Slack, and email threads.',
    foundedAt: '2023-02-14',
    teamSize: 31,
    revenue: '$2.8M ARR',
    lookingFor: ['Series A lead', 'UK/US GTM'],
  },
  {
    id: 'f-6',
    name: 'Tom Bradley',
    company: 'OpusBio',
    sector: 'BioTech',
    stage: 'Pre-seed',
    raiseAmount: 1200000,
    location: 'Boston, MA',
    tagline: 'Generative protein design for rare-disease targets.',
    description:
      'OpusBio combines AlphaFold-derived structure priors with a diffusion model to propose novel binders for orphan indications.',
    foundedAt: '2025-11-05',
    teamSize: 4,
    revenue: 'Grants only',
    lookingFor: ['Pre-seed lead', 'Biotech angels', 'Lab partners'],
  },
  {
    id: 'f-7',
    name: 'Linda Wu',
    company: 'SynthOps',
    sector: 'DevTools',
    stage: 'Seed',
    raiseAmount: 3500000,
    location: 'Toronto, ON',
    tagline: 'Synthetic test environments for distributed systems.',
    description:
      'SynthOps builds deterministic replicas of production from traffic captures so teams can reproduce failures without touching live data.',
    foundedAt: '2024-04-22',
    teamSize: 11,
    revenue: '$600k ARR',
    lookingFor: ['Seed lead', 'Developer-relations hire'],
  },
  {
    id: 'f-8',
    name: 'Raj Malhotra',
    company: 'Edra AI',
    sector: 'EdTech',
    stage: 'Series A',
    raiseAmount: 6000000,
    location: 'Remote / Singapore',
    tagline: 'Personalized tutoring agents for STEM curricula.',
    description:
      'Edra AI pairs students with persistent tutor agents that adapt to school pacing guides, assessment data, and parent goals.',
    foundedAt: '2023-07-30',
    teamSize: 18,
    revenue: '$1.5M ARR',
    lookingFor: ['Series A lead', 'School district pilots'],
  },
];

const SECTOR_OPTIONS = [
  { value: '', label: 'All Sectors' },
  { value: 'AI Infrastructure', label: 'AI Infrastructure' },
  { value: 'Enterprise AI', label: 'Enterprise AI' },
  { value: 'Climate / AgTech', label: 'Climate / AgTech' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'Legal Tech', label: 'Legal Tech' },
  { value: 'BioTech', label: 'BioTech' },
  { value: 'DevTools', label: 'DevTools' },
  { value: 'EdTech', label: 'EdTech' },
];

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'Pre-seed', label: 'Pre-seed' },
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
];

const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'San Francisco, CA', label: 'San Francisco, CA' },
  { value: 'New York, NY', label: 'New York, NY' },
  { value: 'Austin, TX', label: 'Austin, TX' },
  { value: 'Seattle, WA', label: 'Seattle, WA' },
  { value: 'London, UK', label: 'London, UK' },
  { value: 'Boston, MA', label: 'Boston, MA' },
  { value: 'Toronto, ON', label: 'Toronto, ON' },
  { value: 'Remote / Singapore', label: 'Remote / Singapore' },
];

const RAISE_RANGES = [
  { value: '', label: 'Any Raise' },
  { value: '0-1000000', label: 'Under $1M' },
  { value: '1000000-5000000', label: '$1M – $5M' },
  { value: '5000000-10000000', label: '$5M – $10M' },
  { value: '10000000-', label: '$10M+' },
];

const stageColor: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
  'Pre-seed': 'info',
  Seed: 'warning',
  'Series A': 'success',
};

export default function FoundersPage() {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [location, setLocation] = useState('');
  const [raiseRange, setRaiseRange] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    return FOUNDERS.filter((f) => {
      const matchesQuery =
        !query ||
        [f.name, f.company, f.tagline, f.sector, f.location]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesSector = !sector || f.sector === sector;
      const matchesStage = !stage || f.stage === stage;
      const matchesLocation = !location || f.location === location;

      let matchesRaise = true;
      if (raiseRange) {
        const [min, max] = raiseRange.split('-').map((n) => (n ? parseInt(n, 10) : Infinity));
        if (max && max !== Infinity) {
          matchesRaise = f.raiseAmount >= min && f.raiseAmount <= max;
        } else {
          matchesRaise = f.raiseAmount >= min;
        }
      }

      return matchesQuery && matchesSector && matchesStage && matchesLocation && matchesRaise;
    });
  }, [query, sector, stage, location, raiseRange]);

  const hasActiveFilters = query || sector || stage || location || raiseRange;

  const clearFilters = () => {
    setQuery('');
    setSector('');
    setStage('');
    setLocation('');
    setRaiseRange('');
  };

  return (
    <div className="min-h-screen bg-nexus-100 dark:bg-nexus-950">
      {/* Header */}
      <header className="border-b border-nexus-200 dark:border-nexus-800 bg-white dark:bg-nexus-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-nexus-900 dark:text-nexus-100">
                Founder Discovery
              </h1>
              <p className="text-nexus-600 dark:text-nexus-400 mt-1">
                Filter startups by sector, stage, raise amount, and location.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        {showFilters && (
          <Card className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Search"
                  placeholder="Name, company, sector, tagline..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-[3]">
                <Select label="Sector" options={SECTOR_OPTIONS} value={sector} onChange={(e) => setSector(e.target.value)} />
                <Select label="Stage" options={STAGE_OPTIONS} value={stage} onChange={(e) => setStage(e.target.value)} />
                <Select label="Location" options={LOCATION_OPTIONS} value={location} onChange={(e) => setLocation(e.target.value)} />
                <Select label="Raise Amount" options={RAISE_RANGES} value={raiseRange} onChange={(e) => setRaiseRange(e.target.value)} />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="lg:self-end">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-nexus-600 dark:text-nexus-400">
            Showing <span className="font-semibold text-nexus-900 dark:text-nexus-100">{filtered.length}</span> of {FOUNDERS.length} founders
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <Search className="w-12 h-12 mx-auto text-nexus-400 mb-4" />
            <h3 className="text-lg font-medium text-nexus-900 dark:text-nexus-100 mb-2">No founders match</h3>
            <p className="text-nexus-500 dark:text-nexus-400 mb-6">Try adjusting your filters or search terms.</p>
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((founder) => (
              <Card key={founder.id} variant="outlined" className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={stageColor[founder.stage] || 'default'} dot>{founder.stage}</Badge>
                    <Badge variant="default" size="sm">
                      <Building2 className="w-3 h-3 mr-1" />
                      {founder.sector}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-nexus-900 dark:text-nexus-100">{founder.company}</h2>
                  <p className="text-sm text-nexus-500 dark:text-nexus-400">Founded by {founder.name}</p>
                </div>

                <p className="text-nexus-700 dark:text-nexus-300 mb-4 flex-1">{founder.tagline}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-nexus-50 dark:bg-nexus-800 rounded-md p-3">
                    <p className="text-xs text-nexus-500 dark:text-nexus-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Raising
                    </p>
                    <p className="text-lg font-bold text-nexus-900 dark:text-nexus-100 font-mono">{formatCurrency(founder.raiseAmount)}</p>
                  </div>
                  <div className="bg-nexus-50 dark:bg-nexus-800 rounded-md p-3">
                    <p className="text-xs text-nexus-500 dark:text-nexus-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Team
                    </p>
                    <p className="text-lg font-bold text-nexus-900 dark:text-nexus-100">{founder.teamSize}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-nexus-600 dark:text-nexus-400">
                    <MapPin className="w-4 h-4" />
                    {founder.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-nexus-600 dark:text-nexus-400">
                    <TrendingUp className="w-4 h-4" />
                    {founder.revenue}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-nexus-600 dark:text-nexus-400">
                    <Rocket className="w-4 h-4" />
                    Founded {formatDate(founder.foundedAt)}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-nexus-700 dark:text-nexus-300 mb-2">{founder.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {founder.lookingFor.map((item) => (
                      <Badge key={item} variant="primary" size="sm">{item}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-nexus-200 dark:border-nexus-800">
                  <Button variant="outline" className="w-full">
                    View Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
