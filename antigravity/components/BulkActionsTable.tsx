
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Trash2, User, ChevronDown, CheckSquare, Square, MinusSquare } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  title: string;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface BulkActionsTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onArchive: (selectedIds: string[]) => void;
  onDelete: (selectedIds: string[]) => void;
  onAssign: (selectedIds: string[], assigneeId: string) => void;
  assignees?: { id: string; name: string }[];
  emptyMessage?: string;
  isDarkMode?: boolean;
}

const BulkActionsTable = <T extends { id: string }>({
  data,
  columns,
  onArchive,
  onDelete,
  onAssign,
  assignees = [],
  emptyMessage = 'No items to display.',
  isDarkMode = false,
}: BulkActionsTableProps<T>) => {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const allSelected = selectedItemIds.size === data.length && data.length > 0;
  const someSelected = selectedItemIds.size > 0 && selectedItemIds.size < data.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        if (dropdownCloseTimeoutRef.current) {
          clearTimeout(dropdownCloseTimeoutRef.current);
          dropdownCloseTimeoutRef.current = null;
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownMouseEnter = () => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
      dropdownCloseTimeoutRef.current = null;
    }
  };

  const handleDropdownMouseLeave = () => {
    dropdownCloseTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(data.map((item) => item.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAction = (action: 'archive' | 'delete' | 'assign', assigneeId?: string) => {
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) return;

    switch (action) {
      case 'archive':
        onArchive(ids);
        break;
      case 'delete':
        onDelete(ids);
        break;
      case 'assign':
        if (assigneeId) {
          onAssign(ids, assigneeId);
        }
        break;
    }
    setSelectedItemIds(new Set()); // Clear selection after action
    setIsDropdownOpen(false);
  };

  const checkboxIcon = allSelected ? (
    <CheckSquare className="w-5 h-5" />
  ) : someSelected ? (
    <MinusSquare className="w-5 h-5" />
  ) : (
    <Square className="w-5 h-5" />
  );

  const selectedCount = selectedItemIds.size;
  const hasSelection = selectedCount > 0;

  return (
    <div className={`relative rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 rounded-t-xl
              ${isDarkMode ? 'bg-emerald-800/80 text-white shadow-lg' : 'bg-emerald-600 text-white shadow-lg'}
              backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{selectedCount} selected</span>
              <button
                onClick={() => setSelectedItemIds(new Set())}
                className="text-emerald-100 hover:text-white text-sm"
              >
                (Clear selection)
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleAction('archive')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-900 text-white text-sm transition-colors"
              >
                <Archive className="w-4 h-4" /> Archive
              </button>
              <button
                onClick={() => handleAction('delete')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-900 text-white text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              {assignees.length > 0 && (
                <div className="relative" ref={dropdownRef} onMouseEnter={handleDropdownMouseEnter} onMouseLeave={handleDropdownMouseLeave}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-900 text-white text-sm transition-colors"
                  >
                    <User className="w-4 h-4" /> Assign <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
                          ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                      >
                        <div className="py-1">
                          {assignees.map((assignee) => (
                            <a
                              key={assignee.id}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleAction('assign', assignee.id);
                              }}
                              className={`block px-4 py-2 text-sm
                                ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              {assignee.name}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th
                scope="col"
                className={`p-4 text-left text-xs font-medium uppercase tracking-wider
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                <label className="inline-flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                  <div
                    className={`p-1 rounded transition-colors
                      ${isDarkMode ?
                        (allSelected || someSelected ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300') :
                        (allSelected || someSelected ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600')
                      }`}
                  >
                    {checkboxIcon}
                  </div>
                </label>
              </th>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${column.headerClassName || ''}`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isDarkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={`px-6 py-4 whitespace-nowrap text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${selectedItemIds.has(item.id) ? (isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : ''}`}
                >
                  <td className="p-4 whitespace-nowrap">
                    <label className="inline-flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                      <div
                        className={`p-1 rounded transition-colors
                          ${isDarkMode ?
                            (selectedItemIds.has(item.id) ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300') :
                            (selectedItemIds.has(item.id) ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600')
                          }`}
                      >
                        {selectedItemIds.has(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>
                    </label>
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${item.id}-${String(column.key)}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm
                        ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} ${column.cellClassName || ''}`}
                    >
                      {column.render ? column.render(item) : String(item[column.key])}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkActionsTable;
