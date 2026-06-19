/**
 * Strict Input Validation Utilities
 *
 * All user-supplied input is validated against strict allowlists and length
 * limits before it reaches the backend. This module provides the validation
 * layer for task briefs, agent IDs, and generic form fields.
 *
 * @module input-validation
 */

/**
 * Result type for all validation functions. Callers must check `.valid`
 * before accessing `.value` or `.error`.
 *
 * @property valid - `true` if the input passed all validation rules
 * @property value - The sanitised / coerced value (only when `valid === true`)
 * @property error - A human-readable error message (only when `valid === false`)
 */
export type ValidationResult =
  | { valid: true; value: string | number | boolean }
  | { valid: false; error: string };

// ── Task Brief Validation ──

/** Maximum allowed length for a task brief string. */
const TASK_BRIEF_MAX_LENGTH = 500;

/**
 * Allowlisted character pattern for task briefs.
 * Permits alphanumeric characters, spaces, and common punctuation marks.
 * Rejects control characters, special symbols, and injection attempts.
 */
const TASK_BRIEF_PATTERN = /^[a-zA-Z0-9\s.,!?;:'"()\-]+$/;

/**
 * Validate a task brief string against the allowlist pattern and length limit.
 *
 * Steps:
 * 1. Must be a `string` (rejects `null`, `undefined`, numbers, etc.).
 * 2. Must not be empty after trimming.
 * 3. Must not exceed {@link TASK_BRIEF_MAX_LENGTH} characters.
 * 4. Must match {@link TASK_BRIEF_PATTERN}.
 *
 * @param input - The raw input to validate (accepts `unknown` for safety).
 * @returns {@link ValidationResult} — on success the `value` is the trimmed input.
 *
 * @example
 * ```ts
 * validateTaskBrief("Review PR #123")   // → { valid: true, value: "Review PR #123" }
 * validateTaskBrief("")                  // → { valid: false, error: "Task brief cannot be empty" }
 * validateTaskBrief("<script>alert(1)")  // → { valid: false, error: "Task brief contains invalid characters" }
 * ```
 */
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

// ── Agent ID Validation ──

/**
 * Allowlisted agent identifiers. Only agents in this list can be assigned
 * to tasks or appear in operation commands.
 */
const ALLOWED_AGENT_IDS = [
  'codex',
  'claude',
  'hermes',
  'ollama',
  'openclaw',
] as const;

/**
 * Validate an agent ID against the allowlist.
 *
 * @param input - The raw input to validate (accepts `unknown` for safety).
 * @returns {@link ValidationResult} — on success the `value` is the validated agent ID string.
 */
export function validateAgentId(input: unknown): ValidationResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Agent ID must be a string' };
  }
  if (!ALLOWED_AGENT_IDS.includes(input as any)) {
    return { valid: false, error: `Agent ID not allowed. Must be one of: ${ALLOWED_AGENT_IDS.join(', ')}` };
  }
  return { valid: true, value: input };
}

// ── Generic Form Field Validation ──

/**
 * Defines a single validation rule to apply to a form field value.
 *
 * Available rule types:
 * - `required`   — field must be non-empty after trimming.
 * - `email`      — field must match a basic email regex.
 * - `minLength`  — field must have at least `value` characters.
 * - `maxLength`  — field must have at most `value` characters.
 * - `pattern`    — field must match the regex provided in `value`.
 */
export interface FieldValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';
  value?: number | string | RegExp;
  message: string;
}

/**
 * Validate a single form field value against an ordered array of rules.
 *
 * Rules are evaluated in order; the first failing rule's `message` is returned.
 * If all rules pass, `null` is returned (meaning no error).
 *
 * @param value - The raw string value to validate.
 * @param rules - Ordered array of {@link FieldValidationRule} objects.
 * @returns The first error message string, or `null` if all rules pass.
 *
 * @example
 * ```ts
 * const rules: FieldValidationRule[] = [
 *   { type: 'required', message: 'Name is required' },
 *   { type: 'minLength', value: 3, message: 'Min 3 characters' },
 * ];
 * validateField('Jo', rules) // → null
 * validateField('', rules)   // → 'Name is required'
 * ```
 */
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

/**
 * Validate an email address.
 *
 * Checks that the input is a non-empty string matching a basic email pattern.
 * Does not verify deliverability — only format.
 *
 * @param input - The raw input to validate (accepts `unknown` for safety).
 * @returns {@link ValidationResult} — on success the `value` is the trimmed email.
 */
export function validateEmail(input: unknown): ValidationResult {
  if (typeof input !== 'string') return { valid: false, error: 'Email must be a string' };
  const trimmed = input.trim();
  if (trimmed.length === 0) return { valid: false, error: 'Email is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, value: trimmed };
}

/**
 * Validate that a required field is non-empty after trimming.
 *
 * @param input - The raw input to validate (accepts `unknown` for safety).
 * @returns {@link ValidationResult} — on success the `value` is the trimmed input.
 */
export function validateRequired(input: unknown): ValidationResult {
  if (typeof input !== 'string') return { valid: false, error: 'This field is required' };
  if (input.trim().length === 0) return { valid: false, error: 'This field is required' };
  return { valid: true, value: input.trim() };
}

/**
 * Validate that a string meets a minimum length requirement.
 *
 * @param input - The string to check.
 * @param min   - Minimum number of characters required.
 * @returns {@link ValidationResult} — on success the `value` is the original input.
 */
export function validateMinLength(input: string, min: number): ValidationResult {
  if (input.length < min) return { valid: false, error: `Must be at least ${min} characters` };
  return { valid: true, value: input };
}

/**
 * Validate that a string does not exceed a maximum length.
 *
 * @param input - The string to check.
 * @param max   - Maximum number of characters allowed.
 * @returns {@link ValidationResult} — on success the `value` is the original input.
 */
export function validateMaxLength(input: string, max: number): ValidationResult {
  if (input.length > max) return { valid: false, error: `Must be ${max} characters or less` };
  return { valid: true, value: input };
}
