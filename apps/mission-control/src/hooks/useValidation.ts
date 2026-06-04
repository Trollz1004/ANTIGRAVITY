/**
 * useValidation Hook
 *
 * React hook for form validation using Zod schemas.
 *
 * @module useValidation
 */

import { useState, useCallback } from 'react';
import type { z } from 'zod';
import { ValidationError } from '../lib/validation-schemas';

interface UseValidationResult<T> {
  errors: Record<string, string>;
  validate: (data: unknown) => T | null;
  validateField: (field: string, value: unknown) => string | null;
  clearErrors: () => void;
  isValid: boolean;
}

export function useValidation<T>(
  schema: z.ZodSchema<T>,
): UseValidationResult<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(
    (data: unknown): T | null => {
      try {
        const result = schema.parse(data);
        setErrors({});
        return result;
      } catch (err) {
        if (err instanceof ValidationError) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of err.issues) {
            const path = issue.path.join('.');
            fieldErrors[path] = issue.message;
          }
          setErrors(fieldErrors);
        } else if (err && typeof err === 'object' && 'issues' in err) {
          const zodErr = err as { issues: Array<{ path: Array<string | number>; message: string }> };
          const fieldErrors: Record<string, string> = {};
          for (const issue of zodErr.issues) {
            const path = issue.path.join('.');
            fieldErrors[path] = issue.message;
          }
          setErrors(fieldErrors);
        }
        return null;
      }
    },
    [schema],
  );

  const validateField = useCallback(
    (_field: string, _value: unknown): string | null => {
      // Partial validation - full validation on submit
      return null;
    },
    [],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    isValid: Object.keys(errors).length === 0,
  };
}
