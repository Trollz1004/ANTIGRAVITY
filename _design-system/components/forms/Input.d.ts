import * as React from 'react';

export interface InputProps {
  /** Mono uppercase field label rendered above the input. */
  label?: string;
  /** Optional leading icon (e.g. a Lucide glyph). */
  icon?: React.ReactNode;
  /** @default "text" */
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Helper text below the field. */
  hint?: string;
  id?: string;
  style?: React.CSSProperties;
}

/** Dark glass text field — mono label, inset slate fill, cyan focus ring. */
export function Input(props: InputProps): JSX.Element;
