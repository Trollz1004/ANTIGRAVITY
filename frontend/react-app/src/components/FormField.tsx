/**
 * FormField — reusable labeled input with required indicator and inline error.
 */

import type React from 'react';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  value?: any;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  min?: number | string;
  max?: number | string;
  step?: string;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'search';
  autoComplete?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  renderInput?: (props: {
    id: string;
    name: string;
    className: string;
    error: boolean;
  }) => React.ReactNode;
}

export function FormField({
  label,
  name,
  type = 'text',
  required = false,
  error,
  touched = false,
  value,
  placeholder,
  maxLength,
  minLength,
  min,
  max,
  step,
  inputMode,
  autoComplete,
  rows,
  disabled = false,
  className = '',
  icon,
  children,
  onChange,
  onBlur,
  renderInput,
}: FormFieldProps) {
  const showError = touched && error;
  const inputId = `field-${name}`;

  const inputClasses = [
    type === 'textarea' ? 'app-textarea' : type === 'select' ? 'app-select' : 'app-input',
    'input-glow',
    icon ? 'pl-12' : '',
    showError ? 'border-red-500 ring-2 ring-red-500/30' : '',
    disabled ? 'opacity-60 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderInputElement = () => {
    if (renderInput) {
      return renderInput({
        id: inputId,
        name,
        className: inputClasses,
        error: !!showError,
      });
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          className={inputClasses}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={inputClasses}
        >
          {children}
        </select>
      );
    }

    return (
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        min={min}
        max={max}
        step={step}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        className={inputClasses}
      />
    );
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1 text-sm font-black uppercase tracking-[0.14em] text-[#5c594f]"
      >
        {label}
        {required && <span className="text-red-500 font-black">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5c594f]">
            {icon}
          </span>
        )}
        {renderInputElement()}
      </div>

      {showError && (
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
