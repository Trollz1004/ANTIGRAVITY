/**
 * Shared form validation utilities.
 * Provides composable validators, a useFormValidation hook, and helper types.
 */

// ── Hook ───────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

export interface ValidationError {
  message: string;
}

export type ValidationRule = {
  validate: (value: any, formValues?: Record<string, any>) => boolean;
  message: string;
};

export interface FieldConfig {
  name: string;
  label: string;
  required?: boolean;
  rules?: ValidationRule[];
}

export interface FormErrors {
  [fieldName: string]: string | undefined;
}

// ── Individual validators ──────────────────────────────────────────────

export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value === true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateEmail(value: string): boolean {
  if (!value) return false;
  // RFC 5322 simplified — covers 99.9% of real-world emails
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
    value.trim()
  );
}

export function validateMinLength(value: string, min: number): boolean {
  if (!value) return min === 0;
  return value.length >= min;
}

export function validateMaxLength(value: string, max: number): boolean {
  if (!value) return true;
  return value.length <= max;
}

export function validatePattern(value: string, regex: RegExp): boolean {
  if (!value) return true;
  return regex.test(value);
}

export function validateMin(value: number | string, min: number): boolean {
  if (value === null || value === undefined || value === '') return false;
  return Number(value) >= min;
}

export function validateMax(value: number | string, max: number): boolean {
  if (value === null || value === undefined || value === '') return true;
  return Number(value) <= max;
}

// ── Composable rule builders ───────────────────────────────────────────

export function requiredRule(
  message = 'This field is required'
): ValidationRule {
  return { validate: validateRequired, message };
}

export function emailRule(
  message = 'Enter a valid email address'
): ValidationRule {
  return {
    validate: v => !v || validateEmail(v),
    message,
  };
}

export function minLengthRule(
  min: number,
  message = `Must be at least ${min} characters`
): ValidationRule {
  return {
    validate: v => validateMinLength(v, min),
    message,
  };
}

export function maxLengthRule(
  max: number,
  message = `Must be no more than ${max} characters`
): ValidationRule {
  return {
    validate: v => validateMaxLength(v, max),
    message,
  };
}

export function patternRule(
  regex: RegExp,
  message = 'Invalid format'
): ValidationRule {
  return {
    validate: v => validatePattern(v, regex),
    message,
  };
}

export function minRule(
  min: number,
  message = `Must be at least ${min}`
): ValidationRule {
  return {
    validate: v => validateMin(v, min),
    message,
  };
}

export function maxRule(
  max: number,
  message = `Must be no more than ${max}`
): ValidationRule {
  return {
    validate: v => validateMax(v, max),
    message,
  };
}

export function useFormValidation(fieldConfigs: FieldConfig[]) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (
      name: string,
      value: any,
      formValues?: Record<string, any>
    ): string | undefined => {
      const config = fieldConfigs.find(f => f.name === name);
      if (!config) return undefined;

      // Required check
      if (config.required && !validateRequired(value)) {
        return 'This field is required';
      }

      // Run custom rules
      if (config.rules) {
        for (const rule of config.rules) {
          if (!rule.validate(value, formValues)) {
            return rule.message;
          }
        }
      }

      return undefined;
    },
    [fieldConfigs]
  );

  const validateAll = useCallback(
    (formValues: Record<string, any>): FormErrors => {
      const newErrors: FormErrors = {};
      let hasError = false;

      for (const config of fieldConfigs) {
        const value = formValues[config.name];
        const error = validateField(config.name, value, formValues);
        if (error) {
          newErrors[config.name] = error;
          hasError = true;
        }
      }

      setErrors(newErrors);
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      for (const config of fieldConfigs) {
        allTouched[config.name] = true;
      }
      setTouched(allTouched);

      return newErrors;
    },
    [fieldConfigs, validateField]
  );

  const setFieldTouched = useCallback(
    (name: string, value: any, formValues?: Record<string, any>) => {
      setTouched(prev => ({ ...prev, [name]: true }));
      const error = validateField(name, value, formValues);
      setErrors(prev => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const isValid = Object.values(errors).every(e => e === undefined);

  return {
    errors,
    touched,
    isValid,
    validateField,
    validateAll,
    setFieldTouched,
    clearErrors,
  };
}
