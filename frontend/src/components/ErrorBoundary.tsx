import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from '@/pages/ErrorPage';
import { determineErrorType, getErrorMessage } from '@/lib/errorDetection';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: {
        type: determineErrorType(error),
        message: getErrorMessage(error),
        originalError: error,
      },
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You could also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.errorInfo) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorPage
          errorType={this.state.errorInfo.type}
          message={this.state.errorInfo.message}
        />
      );
    }

    return this.props.children;
  }
}

