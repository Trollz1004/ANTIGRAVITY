import React from 'react';
import { useAuth } from '../../lib/auth';
import LoveBot from '../../components/LoveBot';

export function LoveBotPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 h-full max-w-5xl mx-auto stagger-children">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
          Love Consultant
        </h1>
        <p className="text-gray-400">
          Premium-only compatibility tools, romance prompts, dating advice, and gift ideas.
        </p>
      </div>
      
      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <LoveBot user={user} />
      </div>
    </div>
  );
}
