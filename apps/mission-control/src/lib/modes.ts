/**
 * Application Navigation Modes
 *
 * Defines the list of top-level modes displayed in the sidebar and
 * throughout the Mission Control UI. Each mode has an identifier, a
 * human-readable label, and an optional `new` flag for badge display.
 *
 * @module modes
 */

/**
 * Represents a single navigable mode in the application.
 *
 * @property id    - Unique machine-readable identifier (used for routing / state).
 * @property label - Human-readable display label rendered in the sidebar.
 * @property new   - When `true`, a "NEW" badge is displayed next to the mode label.
 */
export const modes = [
  { id: 'mission', label: 'Mission Control', new: true },
  { id: 'ledger', label: 'Mission Ledger', new: true },
  { id: 'roundtable', label: 'AI Roundtable', new: true },
  { id: 'tasks', label: 'Tasks', new: true },
  { id: 'code', label: 'Code Mode' },
  { id: 'banana', label: 'Create · Banana' },
  { id: 'research', label: 'Research Mode' },
  { id: 'chat', label: 'Chat Mode' },
];
