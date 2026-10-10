import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '#dashboard';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-white rounded-3xl border border-rose-200 shadow-card max-w-xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-midnight">
              Unable to Display This Screen
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              {this.props.fallbackMessage ||
                'An unexpected error occurred while loading this view. Your existing customer data and records are safely intact.'}
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-stone-400 bg-stone-50 p-2 rounded-lg mt-3 border border-stone-200/70 truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => (window.location.hash = '#dashboard')}>
              <Home className="w-4 h-4 mr-1.5" />
              Return to Home
            </Button>
            <Button variant="primary" size="sm" onClick={this.handleReload}>
              <RefreshCw className="w-4 h-4 mr-1.5 text-brand-gold" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
