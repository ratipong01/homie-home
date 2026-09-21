import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas p-6 text-center">
          <div className="max-w-sm w-full bg-surface p-6 rounded-2xl border border-surface-muted shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-text-muted mb-4">
              {this.state.error?.message || 'ระบบเกิดข้อผิดพลาดบางอย่าง'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-brand-primary text-text-inverted rounded-xl font-medium text-sm hover:bg-brand-hover active:bg-brand-active transition-colors"
            >
              โหลดใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
