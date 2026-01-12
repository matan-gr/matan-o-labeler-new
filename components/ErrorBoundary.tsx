
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './DesignSystem';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optional: Navigate to home if using a router, or clear bad state
    window.location.href = '/'; 
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 shadow-2xl rounded-2xl p-8 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>

            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">System Error</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred in the application runtime. 
              Our engineering team has been notified.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32 border border-slate-100 dark:border-slate-800">
              <code className="text-[10px] font-mono text-red-600 dark:text-red-400 block">
                {this.state.error?.toString()}
              </code>
            </div>

            <div className="flex gap-3 justify-center">
              <Button 
                variant="secondary" 
                onClick={this.handleReset}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go Home
              </Button>
              <Button 
                variant="primary" 
                onClick={this.handleReload}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 border-transparent text-white"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reload App
              </Button>
            </div>
            
            <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Error Code: 0xCRASH_HANDLER
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
