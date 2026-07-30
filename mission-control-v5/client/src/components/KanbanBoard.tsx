import { useState, type DragEvent } from 'react';
import { api } from '../api';
import type { Column, SwarmTask } from '../types';
import { StatusDot, modeBadge } from './shared';

const COLUMNS: { id: Column; color: string }[] = [
  { id: 'NOW', color: 'var(--amber)' },
  { id: 'NEXT', color: 'var(--accent)' },
  { id: 'BLOCKED', color: 'var(--red)' },
  { id: 'DONE', color: 'var(--green)' },
];

interface Props {
  tasks: SwarmTask[];
}

export default function KanbanBoard({ tasks }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Column | null>(null);

  const onDrop = async (e: DragEvent, column: Column) => {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData('text/plain');
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    try {
      await api.moveTask(id, column);
    } catch (err) {
      console.error('move failed:', err);
    }
  };

  return (
    <div className="kanban">
      {COLUMNS.map((col) => {
        const cards = tasks.filter((t) => t.column === col.id);
        return (
          <div
            key={col.id}
            className={`kanban__col ${overCol === col.id ? 'kanban__col--over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.id);
            }}
            onDragLeave={() => setOverCol((v) => (v === col.id ? null : v))}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <div className="kanban__col-head">
              <span className="dot" style={{ background: col.color }} />
              <span className="kanban__col-title" style={{ color: col.color }}>
                {col.id}
              </span>
              <span className="kanban__col-count">{cards.length}</span>
            </div>
            <div className="kanban__cards">
              {cards.length === 0 && <div className="kanban__empty">EMPTY</div>}
              {cards.map((task) => (
                <div
                  key={task.id}
                  className="kcard"
                  draggable
                  onDragStart={(e) => {
                    setDragId(task.id);
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDragId(null)}
                >
                  <div className="kcard__title">{task.title}</div>
                  <div className="kcard__row">
                    {modeBadge(task.mode)}
                    <span className="badge">
                      {task.agentIds.length} AGENT{task.agentIds.length === 1 ? '' : 'S'}
                    </span>
                  </div>
                  <div className="kcard__agents">
                    {task.agentIds.slice(0, 3).join(' · ')}
                    {task.agentIds.length > 3 ? ` · +${task.agentIds.length - 3}` : ''}
                  </div>
                  {task.error && (
                    <div className="kcard__agents" style={{ color: 'var(--red)' }}>
                      {task.error.slice(0, 160)}
                    </div>
                  )}
                  <div className="kcard__footer">
                    <span className="kcard__status">
                      <StatusDot status={task.status} />
                      {task.status}
                    </span>
                    <span className="kcard__actions">
                      {task.status === 'error' && (
                        <button className="kcard__mini-btn" onClick={() => api.retryTask(task.id)}>
                          RETRY
                        </button>
                      )}
                      <button
                        className="kcard__mini-btn kcard__mini-btn--danger"
                        onClick={() => api.deleteTask(task.id)}
                      >
                        DEL
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
