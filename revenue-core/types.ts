
export enum View {
  DASHBOARD = 'DASHBOARD',
  HIVE = 'HIVE',
  BROWSER = 'BROWSER',
  INTELLIGENCE = 'INTELLIGENCE',
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
  role: 'Research' | 'Poster' | 'Engager' | 'Analyst';
  status: 'Active' | 'Idle' | 'Healing' | 'Error' | 'Paused';
  health: number;
  task: string;
  dependencies?: string[];
  workflowStage: number;
  load: number;
}

export interface ContentDraft {
  id: string;
  title: string;
  body: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  platform: 'Blog' | 'Social' | 'Email';
  tags: string[];
}

export interface ApiConfig {
  geminiKey: string;
  simulationMode: boolean;
  redditClientId?: string;
  youtubeApiKey?: string;
  twitterApiKey?: string;
  linkedinClientId?: string;
}
