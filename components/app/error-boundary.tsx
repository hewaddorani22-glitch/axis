"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-tertiary)" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Something went wrong
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
            We couldn&apos;t load this section. Refresh the page or{" "}
            <a href="/dashboard" className="underline" style={{ color: "var(--accent)" }}>
              return to dashboard
            </a>
            .
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: "" })}
            className="text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
