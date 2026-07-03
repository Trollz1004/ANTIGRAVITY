/**
 * ErrorBoundary — reusable React error boundary component.
 * Uses componentDidCatch and getDerivedStateFromError to gracefully handle
 * JavaScript errors in the component tree and display a fallback UI.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { API_BASE } from '../lib/apiBase';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI. Receives errorId and resetError. */
  fallback?:
    | ReactNode
    | ((errorId: string, resetError: () => void) => ReactNode);
  /** Optional name for the boundary section (used in logging). */
  boundaryName?: string;
  /** Optional callback when an error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = generateErrorId();
    const boundaryName = this.props.boundaryName || 'unknown';

    // Update state with error details
    this.setState({ errorInfo, errorId });

    // Log error with component stack traces
    console.error(
      `[ErrorBoundary:${boundaryName}] Caught error:`,
      '\n  Error ID:',
      errorId,
      '\n  Message:',
      error.message,
      '\n  Stack:',
      error.stack,
      '\n  Component Stack:',
      errorInfo.componentStack
    );

    // Optional: send error report to backend
    this.reportError(error, errorInfo, errorId, boundaryName);

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  private async reportError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    boundaryName: string
  ): Promise<void> {
    try {
      await fetch(`${API_BASE}/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_id: errorId,
          boundary_name: boundaryName,
          message: error.message,
          stack: error.stack,
          component_stack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : '',
          user_agent:
            typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silently fail — don't cause cascading errors from error reporting
      console.error('[ErrorBoundary] Failed to report error to backend');
    }
  }

  private resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private goHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/app';
    }
  };

  private reportIssue = (): void => {
    const { errorId } = this.state;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('error-report', {
          detail: { errorId, boundaryName: this.props.boundaryName },
        })
      );
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback prop takes priority
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.errorId, this.resetError);
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          errorId={this.state.errorId}
          onRetry={this.resetError}
          onGoHome={this.goHome}
          onReport={this.reportIssue}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
