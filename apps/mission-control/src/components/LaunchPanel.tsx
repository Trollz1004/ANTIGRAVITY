import React from 'react';
import { PanelBase } from './PanelBase';

export const LaunchPanel: React.FC = () => (
  <PanelBase title="Launch" path="/health">
    <div className="text-sm text-gray-300">Copy a command and run it in your terminal.</div>
    <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-3">Powered by Ollama Local Runtime</div>
  </PanelBase>
);
