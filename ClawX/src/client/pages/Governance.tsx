import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import {
  Shield,
  Bot,
  Brain,
  Sparkles,
  Search,
  Zap,
  Server,
  Code2,
  User,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Vote,
  Lock,
  Unlock,
  TrendingUp,
} from 'lucide-react';

const voterIcons: Record<string, React.ElementType> = {
  joshua: User,
  manus: Bot,
  claude: Brain,
  gemini: Sparkles,
  perplexity: Search,
  grok: Zap,
  codex: Code2,
};

const voterColors: Record<string, string> = {
  joshua: '#f59e0b',
  manus: '#6366f1',
  claude: '#d97706',
  gemini: '#4285f4',
  perplexity: '#22c55e',
  grok: '#ef4444',
  codex: '#8b5cf6',
};

export default function Governance() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: voters } = trpc.governance.voters.useQuery();
  const { data: stats } = trpc.governance.stats.useQuery();
  const { data: proposals, refetch: refetchProposals } = trpc.governance.proposals.list.useQuery(
    filterStatus !== 'all' ? { status: filterStatus } : {},
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            JoshuaCLAW Governance
          </h1>
          <p className="text-muted-foreground mt-1">
            7 Voters. 4/7 Majority. No Ties. Every critical change requires the team's vote.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Governance Proposal</DialogTitle>
            </DialogHeader>
            <CreateProposalForm
              onSuccess={() => {
                setShowCreate(false);
                refetchProposals();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Vote} label="Total Proposals" value={stats?.total ?? 0} color="#6366f1" />
        <StatCard icon={Clock} label="Pending" value={stats?.pending ?? 0} color="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Approved" value={stats?.approved ?? 0} color="#22c55e" />
        <StatCard icon={XCircle} label="Rejected" value={stats?.rejected ?? 0} color="#ef4444" />
      </div>

      {/* Voter Panel - The Red/Green Light Board */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Officially Unofficial Voting Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {voters?.map((voter) => {
              const Icon = voterIcons[voter.slug] ?? Bot;
              const color = voterColors[voter.slug] ?? '#6366f1';
              return (
                <VoterCard
                  key={voter.slug}
                  name={voter.name}
                  role={voter.role}
                  type={voter.type}
                  position={voter.position}
                  icon={Icon}
                  color={color}
                  isHuman={voter.type === 'human'}
                />
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              Approve
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
              Reject
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              No Vote Yet
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>6 AI (Even) + 1 Human (Odd) = 7 Total | Majority = 4 Votes</span>
          </div>
        </CardContent>
      </Card>

      {/* Proposals List */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {proposals && proposals.length > 0 ? (
          proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isSelected={selectedProposal === proposal.id}
              onSelect={() => setSelectedProposal(selectedProposal === proposal.id ? null : proposal.id)}
              onVoteSuccess={refetchProposals}
            />
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No proposals yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Create the first governance proposal to start the voting process.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VoterCard({
  name,
  role,
  type,
  position,
  icon: Icon,
  color,
  isHuman,
}: {
  name: string;
  role: string;
  type: string;
  position: number;
  icon: React.ElementType;
  color: string;
  isHuman: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
      <div className="absolute top-1.5 right-1.5 text-[10px] font-mono text-muted-foreground/50">#{position}</div>
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold leading-tight">{name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{role}</p>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0"
        style={{ borderColor: isHuman ? '#f59e0b' : color, color: isHuman ? '#f59e0b' : color }}
      >
        {isHuman ? 'HUMAN' : 'AI'}
      </Badge>
    </div>
  );
}

function ProposalCard({
  proposal,
  isSelected,
  onSelect,
  onVoteSuccess,
}: {
  proposal: any;
  isSelected: boolean;
  onSelect: () => void;
  onVoteSuccess: () => void;
}) {
  const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
    approved: { bg: 'bg-green-500/10', text: 'text-green-500', icon: CheckCircle2 },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle },
    expired: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', icon: AlertTriangle },
  };

  const tierColors: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    critical: { label: 'CRITICAL', color: '#ef4444', icon: Lock },
    operational: { label: 'OPERATIONAL', color: '#3b82f6', icon: Unlock },
  };

  const status = statusColors[proposal.status] ?? statusColors.pending;
  const tier = tierColors[proposal.tier] ?? tierColors.operational;
  const StatusIcon = status.icon;
  const TierIcon = tier.icon;
  const progress = proposal.requiredVotes > 0 ? (proposal.approveVotes / proposal.requiredVotes) * 100 : 0;

  return (
    <Card className={`bg-card border-border transition-all cursor-pointer ${isSelected ? 'ring-1 ring-primary' : ''}`}>
      <CardContent className="p-4" onClick={onSelect}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 gap-1"
                style={{ borderColor: tier.color, color: tier.color }}
              >
                <TierIcon className="h-3 w-3" />
                {tier.label}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 gap-1 ${status.bg} ${status.text} border-0`}>
                <StatusIcon className="h-3 w-3" />
                {proposal.status.toUpperCase()}
              </Badge>
              <span className="text-[10px] text-muted-foreground">by {proposal.proposedBy}</span>
            </div>
            <h3 className="font-semibold text-sm">{proposal.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proposal.description}</p>
          </div>

          {/* Vote Progress Ring */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative h-14 w-14">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="oklch(0.28 0 0)" strokeWidth="4" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke={
                    proposal.status === 'approved' ? '#22c55e' : proposal.status === 'rejected' ? '#ef4444' : '#6366f1'
                  }
                  strokeWidth="4"
                  strokeDasharray={`${(progress / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">
                  {proposal.approveVotes}/{proposal.requiredVotes}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{proposal.totalVotes}/7 voted</span>
          </div>
        </div>

        {/* Expanded Vote Details */}
        {isSelected && (
          <ProposalVoteDetail proposalId={proposal.id} status={proposal.status} onVoteSuccess={onVoteSuccess} />
        )}
      </CardContent>
    </Card>
  );
}

function ProposalVoteDetail({
  proposalId,
  status,
  onVoteSuccess,
}: {
  proposalId: number;
  status: string;
  onVoteSuccess: () => void;
}) {
  const { data: votes, refetch: refetchVotes } = trpc.governance.votes.list.useQuery({ proposalId });
  const { data: voters } = trpc.governance.voters.useQuery();
  const castVote = trpc.governance.votes.cast.useMutation({
    onSuccess: () => {
      refetchVotes();
      onVoteSuccess();
    },
  });

  const votedSlugs = useMemo(() => new Set(votes?.map((v) => v.voterSlug) ?? []), [votes]);

  return (
    <div className="mt-4 pt-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">VOTE BOARD</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {voters?.map((voter) => {
          const Icon = voterIcons[voter.slug] ?? Bot;
          const color = voterColors[voter.slug] ?? '#6366f1';
          const existingVote = votes?.find((v) => v.voterSlug === voter.slug);
          const hasVoted = votedSlugs.has(voter.slug);

          // Red/Green light logic
          let lightColor = 'bg-zinc-700'; // No vote
          let glowClass = '';
          if (hasVoted && existingVote?.vote === 'approve') {
            lightColor = 'bg-green-500';
            glowClass = 'shadow-[0_0_12px_rgba(34,197,94,0.7)]';
          } else if (hasVoted && existingVote?.vote === 'reject') {
            lightColor = 'bg-red-500';
            glowClass = 'shadow-[0_0_12px_rgba(239,68,68,0.7)]';
          }

          return (
            <div key={voter.slug} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-secondary/20">
              {/* The Light */}
              <div className={`h-4 w-4 rounded-full ${lightColor} ${glowClass} transition-all duration-500`} />
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="text-[10px] font-medium text-center leading-tight">{voter.name}</span>
              {hasVoted ? (
                <span
                  className={`text-[9px] font-bold ${
                    existingVote?.vote === 'approve' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {existingVote?.vote === 'approve' ? 'YES' : 'NO'}
                </span>
              ) : status === 'pending' ? (
                <div className="flex gap-1">
                  <button
                    className="h-5 w-5 rounded bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition-colors"
                    onClick={() => castVote.mutate({ proposalId, voterSlug: voter.slug, vote: 'approve' })}
                    disabled={castVote.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  </button>
                  <button
                    className="h-5 w-5 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                    onClick={() => castVote.mutate({ proposalId, voterSlug: voter.slug, vote: 'reject' })}
                    disabled={castVote.isPending}
                  >
                    <XCircle className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              ) : (
                <span className="text-[9px] text-muted-foreground">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Vote Reasoning */}
      {votes && votes.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <h5 className="text-[10px] font-semibold text-muted-foreground">REASONING</h5>
          {votes
            .filter((v) => v.reasoning)
            .map((v) => {
              const Icon = voterIcons[v.voterSlug] ?? Bot;
              const color = voterColors[v.voterSlug] ?? '#6366f1';
              return (
                <div key={v.id} className="flex items-start gap-2 text-xs">
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color }} />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{v.voterSlug}:</strong> {v.reasoning}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function CreateProposalForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<'critical' | 'operational'>('operational');
  const [category, setCategory] = useState('');
  const [proposedBy, setProposedBy] = useState('joshua');

  const createProposal = trpc.governance.proposals.create.useMutation({
    onSuccess,
  });

  const categories =
    tier === 'critical'
      ? ['', 'contract-deploy', 'iron-wall', 'team-member', 'governance-change']
      : ['bug-fix', 'ui-update', 'marketing', 'documentation', 'feature-add'];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Proposal Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Update  to 70/20/10"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the proposed change in detail..."
          className="w-full min-h-[80px] rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tier</Label>
          <Select
            value={tier}
            onValueChange={(v) => {
              setTier(v as any);
              setCategory('');
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Tier 1 — Critical (4/7)</SelectItem>
              <SelectItem value="operational">Tier 2 — Operational (3/7)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Proposed By</Label>
        <Select value={proposedBy} onValueChange={setProposedBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="joshua">Joshua (Founder)</SelectItem>
            <SelectItem value="manus">Manus (Legacy Guardian)</SelectItem>
            <SelectItem value="claude">Claude/Opus (CTO)</SelectItem>
            <SelectItem value="gemini">Gemini (Agentic Ops)</SelectItem>
            <SelectItem value="perplexity">Perplexity/Comet (Architect)</SelectItem>
            <SelectItem value="grok">Grok (Adversarial)</SelectItem>
            <SelectItem value="codex">Codex (Keyholder)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        onClick={() => createProposal.mutate({ title, description, tier, category, proposedBy })}
        disabled={!title || !description || !category || createProposal.isPending}
      >
        {createProposal.isPending ? 'Creating...' : 'Submit Proposal for Vote'}
      </Button>
    </div>
  );
}
