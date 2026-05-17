import React, { useState, useCallback } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { apiPost } from '../lib/api';
import { useToast } from '../lib/useToast';
import { validateTaskBrief } from '../lib/input-validation';

export const TaskBriefInput: React.FC = () => {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const { success, error: toastError } = useToast();

  const validate = useCallback((value: string) => {
    if (!touched) return null;
    const result = validateTaskBrief(value);
    return result.valid ? null : result.error;
  }, [touched]);

  const submit = async () => {
    setTouched(true);
    const result = validateTaskBrief(brief);
    if (!result.valid) {
      return;
    }
    setLoading(true);
    const apiResult = await apiPost('/tasks/dispatch', { brief: (result.value as string), agents: [] });
    setLoading(false);
    if (apiResult) {
      success('Task dispatched successfully');
      setBrief('');
      setTouched(false);
    } else {
      toastError('Failed to dispatch task');
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrief(e.target.value);
  };

  const validationError = validate(brief);

  return (
    <div className="bg-panel rounded border border-border p-2 mb-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          data-testid="task-input"
          value={brief}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          onKeyDown={onKey}
          placeholder="Type a task brief — dispatches to selected agents and creates a tracked task…"
          className={`flex-1 bg-transparent border-none outline-none text-sm font-sans text-gray-200 placeholder-gray-500 ${validationError ? 'text-red-300' : ''}`}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'task-brief-error' : undefined}
        />
        <button
          onClick={submit}
          data-testid="task-send-btn"
          disabled={!brief.trim() || loading}
          className="p-2 rounded bg-accentCyan/20 border border-accentCyan/50 text-accentCyan disabled:opacity-30 hover:bg-accentCyan/30 transition"
        >
          <Send size={14} />
        </button>
      </div>
      {validationError && (
        <div id="task-brief-error" className="mt-1 flex items-center gap-1 text-xs text-red-400" role="alert">
          <AlertCircle size={12} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
