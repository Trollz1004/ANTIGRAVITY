import React from 'react';
import { clsx } from 'clsx';

type ModeButtonProps = {
  icon: React.ReactNode; // could be a lucide icon component
  label: string;
  isActive: boolean;
  isNew?: boolean;
  onClick: () => void;
};

export const ModeButton: React.FC<ModeButtonProps> = ({icon, label, isActive, isNew, onClick}) => (
  <button
    className={clsx('flex items-center w-full p-2 rounded mb-2', {
      'bg-accentCyan': isActive,
    })}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
    {isNew && <span className="ml-1 text-xs bg-magenta text-black rounded px-1">NEW</span>}
  </button>
);
