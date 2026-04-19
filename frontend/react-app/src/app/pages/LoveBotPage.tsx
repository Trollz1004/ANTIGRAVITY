import React from 'react';
import { useAuth } from '../../lib/auth';
import LoveBot from '../../components/LoveBot';

export function LoveBotPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="app-page">
      <div className="app-page-inner h-full max-w-5xl stagger-children">
        <div className="mb-8">
          <div className="app-kicker mb-3">Concierge</div>
          <h1 className="app-title">romance concierge.</h1>
          <p className="app-subtitle mt-4 max-w-2xl">
            Premium-only compatibility tools, prompts, gift ideas, and
            date-planning support without turning the whole app into a chatbot
            skin.
          </p>
        </div>

        <div className="h-[calc(100vh-260px)] min-h-[520px] rounded-[2rem] border-4 border-[#111111] bg-[#fffaf2] p-2 shadow-[10px_10px_0_0_rgba(17,17,17,1)]">
          <LoveBot user={user} />
        </div>
      </div>
    </div>
  );
}
