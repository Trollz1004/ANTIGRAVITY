
'use client';

import React, { useState } from 'react';
import BulkActionsTable from '../../components/BulkActionsTable';
import { format } from 'date-fns';
import { Tag, Calendar, User, Info, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  dueDate: Date;
  assignee: { id: string; name: string };
  priority: 'low' | 'medium' | 'high';
}

const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Review Q3 financial reports',
    status: 'in-progress',
    dueDate: new Date(2026, 5, 25),
    assignee: { id: 'user-1', name: 'Alice' },
    priority: 'high',
  },
  {
    id: 'task-2',
    title: 'Prepare marketing campaign brief',
    status: 'pending',
    dueDate: new Date(2026, 6, 10),
    assignee: { id: 'user-2', name: 'Bob' },
    priority: 'medium',
  },
  {
    id: 'task-3',
    title: 'Update user documentation',
    status: 'completed',
    dueDate: new Date(2026, 4, 15),
    assignee: { id: 'user-1', name: 'Alice' },
    priority: 'low',
  },
  {
    id: 'task-4',
    title: 'Schedule team offsite',
    status: 'pending',
    dueDate: new Date(2026, 6, 1),
    assignee: { id: 'user-3', name: 'Charlie' },
    priority: 'high',
  },
  {
    id: 'task-5',
    title: 'Bug fix for payment gateway',
    status: 'in-progress',
    dueDate: new Date(2026, 5, 30),
    assignee: { id: 'user-2', name: 'Bob' },
    priority: 'high',
  },
];

const assignees = [
  { id: 'user-1', name: 'Alice' },
  { id: 'user-2', name: 'Bob' },
  { id: 'user-3', name: 'Charlie' },
];

export default function MissionControlPage() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [isDarkMode, setIsDarkMode] = useState(true); // Assuming dark mode for demo

  const handleArchive = (selectedIds: string[]) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        selectedIds.includes(task.id) ? { ...task, status: 'archived' } : task
      )
    );
    console.log('Archived tasks:', selectedIds);
  };

  const handleDelete = (selectedIds: string[]) => {
    setTasks((prevTasks) => prevTasks.filter((task) => !selectedIds.includes(task.id)));
    console.log('Deleted tasks:', selectedIds);
  };

  const handleAssign = (selectedIds: string[], assigneeId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        selectedIds.includes(task.id) ? { ...task, assignee: assignees.find(a => a.id === assigneeId) || task.assignee } : task
      )
    );
    console.log(`Assigned tasks ${selectedIds} to ${assigneeId}`);
  };

  const columns = [
    {
      key: 'title',
      title: 'Task Title',
      render: (task: Task) => (
        <div className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">{task.title}</div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (task: Task) => {
        let colorClass = '';
        let icon = null;
        switch (task.status) {
          case 'pending':
            colorClass = 'text-yellow-500 bg-yellow-500/10';
            icon = <Clock className="w-3 h-3" />;
            break;
          case 'in-progress':
            colorClass = 'text-blue-500 bg-blue-500/10';
            icon = <Info className="w-3 h-3" />;
            break;
          case 'completed':
            colorClass = 'text-green-500 bg-green-500/10';
            icon = <CheckCircle className="w-3 h-3" />;
            break;
          case 'archived':
            colorClass = 'text-gray-500 bg-gray-500/10';
            icon = <Archive className="w-3 h-3" />;
            break;
        }
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {icon} {task.status.replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      render: (task: Task) => (
        <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
          <Calendar className="w-3 h-3" /> {format(task.dueDate, 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      key: 'assignee',
      title: 'Assignee',
      render: (task: Task) => (
        <span className="inline-flex items-center gap-1 text-purple-400 text-sm">
          <User className="w-3 h-3" /> {task.assignee.name}
        </span>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (task: Task) => {
        let colorClass = '';
        switch (task.priority) {
          case 'low':
            colorClass = 'text-green-400';
            break;
          case 'medium':
            colorClass = 'text-yellow-400';
            break;
          case 'high':
            colorClass = 'text-red-400';
            break;
        }
        return (
          <span className={`inline-flex items-center gap-1 ${colorClass} text-sm`}>
            <Tag className="w-3 h-3" /> {task.priority.toUpperCase()}
          </span>
        );
      },
    },
  ];

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto py-10"
      >
        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
          Mission Control
        </h1>
        <p className={`text-xl mb-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your tasks with bulk actions. Select multiple items to archive, delete, or reassign.
        </p>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        <BulkActionsTable
          data={tasks}
          columns={columns}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onAssign={handleAssign}
          assignees={assignees}
          isDarkMode={isDarkMode}
          emptyMessage="No tasks found. Time to relax!"
        />
      </motion.div>
    </div>
  );
}
