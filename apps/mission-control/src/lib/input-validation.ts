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

// ── Generic form field validation ──

export interface FieldValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';
  value?: number | string | RegExp;
  message: string;
}

export function validateField(value: string, rules: FieldValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.trim().length === 0) return rule.message;
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return rule.message;
        break;
      case 'minLength':
        if (value && value.length < (rule.value as number)) return rule.message;
        break;
      case 'maxLength':
        if (value && value.length > (rule.value as number)) return rule.message;
        break;
      case 'pattern':
        if (value && !(rule.value as RegExp).test(value)) return rule.message;
        break;
    }
  }
  return null;
}

export function validateEmail(input: unknown): ValidationResult {
  if (typeof input !== 'string') return { valid: false, error: 'Email must be a string' };
  const trimmed = input.trim();
  if (trimmed.length === 0) return { valid: false, error: 'Email is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, value: trimmed };
}

export function validateRequired(input: unknown): ValidationResult {
  if (typeof input !== 'string') return { valid: false, error: 'This field is required' };
  if (input.trim().length === 0) return { valid: false, error: 'This field is required' };
  return { valid: true, value: input.trim() };
}

export function validateMinLength(input: string, min: number): ValidationResult {
  if (input.length < min) return { valid: false, error: `Must be at least ${min} characters` };
  return { valid: true, value: input };
}

export function validateMaxLength(input: string, max: number): ValidationResult {
  if (input.length > max) return { valid: false, error: `Must be ${max} characters or less` };
  return { valid: true, value: input };
}
