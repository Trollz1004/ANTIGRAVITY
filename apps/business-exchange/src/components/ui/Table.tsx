'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | string;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyField,
  striped = true,
  hoverable = true,
  emptyMessage = 'No data available',
  className
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-nexus-200 dark:border-nexus-800">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left font-medium text-nexus-500 dark:text-nexus-400',
                  'uppercase tracking-wider text-xs',
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-nexus-200 dark:divide-nexus-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-nexus-500 dark:text-nexus-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={String(row[keyField as keyof T])}
                className={cn(
                  striped && rowIndex % 2 === 0 && 'bg-nexus-50 dark:bg-nexus-900/50',
                  hoverable && 'hover:bg-nexus-100 dark:hover:bg-nexus-800/50',
                  'transition-colors'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-nexus-900 dark:text-nexus-100', column.className)}
                  >
                    {column.render
                      ? column.render(row, rowIndex)
                      : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageSize?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageSize,
  pageSize,
  onPageSizeChange
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-nexus-200 dark:border-nexus-800">
      <div className="text-sm text-nexus-500 dark:text-nexus-400">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {showPageSize && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
            className="px-2 py-1 text-sm border border-nexus-300 dark:border-nexus-600 rounded-md bg-white dark:bg-nexus-900 text-nexus-900 dark:text-nexus-100"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        )}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm border border-nexus-300 dark:border-nexus-600 rounded-md bg-white dark:bg-nexus-900 text-nexus-700 dark:text-nexus-300 hover:bg-nexus-100 dark:hover:bg-nexus-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm border border-nexus-300 dark:border-nexus-600 rounded-md bg-white dark:bg-nexus-900 text-nexus-700 dark:text-nexus-300 hover:bg-nexus-100 dark:hover:bg-nexus-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
