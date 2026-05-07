// Strict input allowlist validation utilities for mission-control
export type ValidationResult =
  | { valid: true; value: string | number | boolean }
  | { valid: false; error: string };

// Allowlist for task brief: max 500 chars, alphanumeric + common punctuation
const TASK_BRIEF_MAX_LENGTH = 500;
const TASK_BRIEF_PATTERN = /^[a-zA-Z0-9\s.,!?;:'"()\-]+$/;

export function validateTaskBrief(input: unknown): ValidationResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Task brief must be a string' };
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Task brief cannot be empty' };
  }
  if (trimmed.length > TASK_BRIEF_MAX_LENGTH) {
    return { valid: false, error: `Task brief must be ${TASK_BRIEF_MAX_LENGTH} characters or less` };
  }
  if (!TASK_BRIEF_PATTERN.test(trimmed)) {
    return { valid: false, error: 'Task brief contains invalid characters' };
  }
  return { valid: true, value: trimmed };
}

// Validate agent list (array of strings, allowed agent IDs matching UI)
const ALLOWED_AGENT_IDS = [
  'codex',
  'claude',
  'hermes',
  'ollama',
  'paperclip',
] as const;

export function validateAgentId(input: unknown): ValidationResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Agent ID must be a string' };
  }
  if (!ALLOWED_AGENT_IDS.includes(input as any)) {
    return { valid: false, error: `Agent ID not allowed. Must be one of: ${ALLOWED_AGENT_IDS.join(', ')}` };
  }
  return { valid: true, value: input };
}
