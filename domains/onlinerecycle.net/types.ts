import React from 'react';

export interface StepDefinition {
  id: string;
  title: string;
  icon: React.ReactElement<{ className?: string }>; // Modified: icon can accept className
  ContentComponent: React.FC;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}