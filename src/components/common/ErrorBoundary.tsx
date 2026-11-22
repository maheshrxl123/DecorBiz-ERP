import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DecorBiz] Uncaught UI error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  private handleGoHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B91C1C] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C1917]">Something went wrong</h1>
              <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">
                {this.state.message}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F4D3A] hover:bg-[#143528] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E7E5E4] bg-white hover:bg-[#F6F3EE] text-[#1C1917] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
