
export enum View {
  DASHBOARD = 'DASHBOARD',
  HIVE = 'HIVE',
  BROWSER = 'BROWSER',
  INTELLIGENCE = 'INTELLIGENCE',
  ADS = 'ADS',
  ROYALTY = 'ROYALTY',
  SETTINGS = 'SETTINGS'
}

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  type: 'audio' | 'video';
}

export interface ResearchItem {
  id: string;
  url: string;
  source: 'Thread' | 'Group' | 'Blog' | 'Social' | 'Map';
  title: string;
  engagementScore: number;
  status: 'New' | 'Analyzed' | 'Ignored' | 'Actioned';
  followers: number;
  isPersonal: boolean;
  lastScraped: string;
}

export interface Agent {
  id: string;
  name: string;
  role: 'Commander' | 'Builder' | 'Researcher' | 'Analyst' | 'Poster' | 'Engager';
  status: 'Active' | 'Idle' | 'Standby' | 'Error' | 'Paused';
  health: number;
  task: string;
  dependencies?: string[];
  workflowStage: number;
  load: number;
  model?: string;
  provider?: string;
  node?: string;
}

export interface ContentDraft {
  id: string;
  title: string;
  body: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  platform: 'Blog' | 'Social' | 'Email';
  tags: string[];
}

export interface StripeMetrics {
  revenue: number;
  customers: number;
  subscriptions: number;
  lastPayment: string | null;
  products: { name: string; sales: number; revenue: number }[];
}

export interface ApiConfig {
  geminiKey: string;
  stripeKey?: string;
  redditClientId?: string;
  youtubeApiKey?: string;
  twitterApiKey?: string;
  linkedinClientId?: string;
}
