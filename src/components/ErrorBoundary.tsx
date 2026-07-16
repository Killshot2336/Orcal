import React from 'react';

interface State {
  error: Error | null;
}

/** Prevents a blank white screen — surfaces the failure in-UI. */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: '#141c1a',
            color: '#f3e8d8',
            fontFamily: 'Georgia, serif',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <h1 style={{ color: '#e6c48a' }}>Sanctuary stumbled</h1>
            <p style={{ color: '#b9a992' }}>{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.assign(`${import.meta.env.BASE_URL}#/`)}
              style={{
                marginTop: 16,
                padding: '10px 16px',
                borderRadius: 12,
                border: 'none',
                background: '#d4a574',
                color: '#141c1a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Sanctuary
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
