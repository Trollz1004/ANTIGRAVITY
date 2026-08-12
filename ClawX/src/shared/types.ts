export interface DaoLaunch {
  id: string;
  name: string;
  token: string;
  treasury: number;
  launchDate: string;
  proposals: number | null;
}

export interface StartupKpis {
  mrr: number;
  cac: number;
  churnRate: string;
  burnRate: number;
  runway: number;
}

export interface KickstarterProject {
  id: string;
  name: string;
  goal: number;
  pledged: number;
  backers: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
  status: 'success' | 'failure' | 'pending';
  metadata?: {
    targetId?: string;
    targetType?: 'user' | 'system' | 'repo' | 'dating_user';
    actionType?: 'security' | 'retry' | 'none' | 'ban' | 'verify';
  };
}

export type View =
  | 'dashboard'
  | 'dao'
  | 'kickstarter'
  | 'chat'
  | 'live'
  | 'command'
  | 'audit'
  | 'media'
  | 'kids'
  | 'dating'
  | 'impact'
  | 'browser'
  | 'security'
  | 'governance'
  | 'mobile';

// FIX: Made uri and title optional to match the GroundingChunk type from the @google/genai SDK, resolving a type incompatibility.
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  groundingSources?: GroundingChunk[];
  image?: string; // Base64 string
}

export interface CampaignPlan {
  title: string;
  emailSubject: string;
  emailBody: string;
  socialPost: string;
  estimatedReach: string;
}

export type SystemHealth = 'Healthy' | 'Degraded' | 'Critical';

// Dating App Types
export type SubscriptionTier = 'Free' | 'Basic' | 'Premium' | 'VIP';

export interface DatingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: SubscriptionTier;
  trustScore: number;
  verified: boolean;
  status: 'active' | 'banned' | 'suspended';
  joinedAt: string;
  matches: number;
  revenue: number; // Lifetime value
}

// Security & Compliance Types
export interface ComplianceCheck {
  id: string;
  name: string;
  category: 'legal' | 'financial' | 'technical';
  status: 'pass' | 'fail' | 'warning';
  details: string;
  lastChecked: string;
}

// DAO Governance Types
export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'rejected';
  endDate: string;
}

export interface TreasuryAsset {
  asset: string;
  amount: number;
  valueUsd: number;
  allocation: ' (50%)' | 'Operations (50%)';
}

// File System Types (Shim for TypeScript)
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
  }
  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
  }
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }
}
