import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** Last line of defence: a render error shows a way out instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('World Heritage Explorer crashed', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid h-dvh place-items-center bg-canvas px-6 text-center text-ink" role="alert">
        <div className="max-w-sm">
          <h1 className="font-serif text-xl font-medium">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">
            The map hit an unexpected error. Reloading usually fixes it, and your filters are kept
            in the address bar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-medium text-canvas transition hover:bg-ink/90"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
