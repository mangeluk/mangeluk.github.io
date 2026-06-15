'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          fontFamily: 'monospace',
          color: '#ff5555',
          textAlign: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>⚠</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: 12, color: '#888', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: 8,
              padding: '8px 20px',
              background: '#00ff9f',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
