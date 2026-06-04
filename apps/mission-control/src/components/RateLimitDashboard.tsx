import React from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { PanelBase } from './PanelBase';
import { useRateLimits } from '../lib/useRateLimits';

export const RateLimitDashboard: React.FC = () => {
  const { data, loading, error, refetch } = useRateLimits();

  const percentage = data
    ? Math.min(100, Math.round((data.requestsThisMinute / data.requestsPerMinute) * 100))
    : 0;

  const statusColor =
    percentage >= 90 ? 'text-red-400' : percentage >= 70 ? 'text-yellow-400' : 'text-green-400';
  const barColor =
    percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <PanelBase
      title="Rate Limit Dashboard"
      icon={<Shield size={16} className="text-accentCyan" />}
      data-testid="rate-limit-dashboard"
    >
      <div className="space-y-4">
        {loading && !data && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Activity size={14} className="animate-spin" />
            Loading rate limit data...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle size={14} />
            Error loading data: {error}
          </div>
        )}

        {data && (
          <>
            {/* Usage bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Requests / minute</span>
                <span className={statusColor}>
                  {data.requestsThisMinute} / {data.requestsPerMinute}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-mono text-gray-500">{percentage}% used</div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded p-2 border border-border">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Remaining</div>
                <div className={`text-lg font-mono ${statusColor}`}>
                  {Math.max(0, data.requestsPerMinute - data.requestsThisMinute)}
                </div>
              </div>
              <div className="bg-background/50 rounded p-2 border border-border">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Reset In</div>
                <div className="text-lg font-mono text-gray-200">
                  {data.resetInSeconds}s
                </div>
              </div>
              <div className="bg-background/50 rounded p-2 border border-border">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Total Today</div>
                <div className="text-lg font-mono text-gray-200">
                  {data.totalRequestsToday.toLocaleString()}
                </div>
              </div>
              <div className="bg-background/50 rounded p-2 border border-border">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Status</div>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle size={12} className="text-green-400" />
                  <span className="text-xs font-mono text-green-400">Active</span>
                </div>
              </div>
            </div>

            {/* Top endpoints */}
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">
                Top Endpoints (24h)
              </div>
              <div className="space-y-1">
                {data.topEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-xs font-mono bg-background/30 rounded px-2 py-1"
                  >
                    <span className="text-gray-300 truncate flex-1">{ep.path}</span>
                    <span className="text-accentCyan ml-2">{ep.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Refresh button */}
        <button
          onClick={refetch}
          className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-accentCyan transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
    </PanelBase>
  );
};
