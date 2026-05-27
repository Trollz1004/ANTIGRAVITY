import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface SearchFilterState {
  query: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const defaultSearchFilter: SearchFilterState = {
  query: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

export function isSearchFilterActive(filter: SearchFilterState): boolean {
  return Boolean(filter.query || filter.status || filter.dateFrom || filter.dateTo);
}

export function applySearchFilter<T extends Record<string, any>>(
  items: T[],
  filter: SearchFilterState,
  fields: (keyof T)[]
): T[] {
  return items.filter(item => {
    // Text search
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const matches = fields.some(field => {
        const val = item[field];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      });
      if (!matches) return false;
    }

    // Status filter
    if (filter.status) {
      const itemStatus = String(item.status ?? '').toLowerCase();
      if (itemStatus !== filter.status.toLowerCase()) return false;
    }

    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      // Try common date fields
      const dateVal = item.queued_at ?? item.started_at ?? item.checked_at ?? item.mtime ?? '';
      if (dateVal) {
        const dateStr = String(dateVal);
        if (filter.dateFrom && dateStr < filter.dateFrom) return false;
        if (filter.dateTo && dateStr > filter.dateTo) return false;
      }
    }

    return true;
  });
}

interface SearchFilterProps {
  filter: SearchFilterState;
  onChange: (filter: SearchFilterState) => void;
  statusOptions?: string[];
  compact?: boolean;
}

const STATUS_OPTIONS = ['ok', 'degraded', 'unreachable', 'running', 'succeeded', 'failed', 'queued'];

export const SearchFilter = ({ filter, onChange, statusOptions, compact }: SearchFilterProps) => {
  const statuses = statusOptions ?? STATUS_OPTIONS;
  const hasFilter = isSearchFilterActive(filter);

  const update = (partial: Partial<SearchFilterState>) => {
    onChange({ ...filter, ...partial });
  };

  const clear = () => {
    onChange({ ...defaultSearchFilter });
  };

  return (
    <div className={clsx('flex flex-wrap items-center gap-2', compact ? '' : 'mb-3')}>
      <div className="relative flex-1 min-w-0">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={filter.query}
          onChange={e => update({ query: e.target.value })}
          placeholder="Search..."
          aria-label="Search filter"
          className="w-full rounded-md border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
        />
      </div>

      <select
        value={filter.status}
        onChange={e => update({ status: e.target.value })}
        aria-label="Status filter"
        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-400/60 focus:outline-none"
      >
        <option value="">All statuses</option>
        {statuses.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <input
        type="date"
        value={filter.dateFrom}
        onChange={e => update({ dateFrom: e.target.value })}
        aria-label="From date"
        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-400/60 focus:outline-none"
      />
      <input
        type="date"
        value={filter.dateTo}
        onChange={e => update({ dateTo: e.target.value })}
        aria-label="To date"
        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-400/60 focus:outline-none"
      />

      {hasFilter && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear filters"
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-400 transition hover:border-cyan-400/60 hover:text-slate-200"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
};
