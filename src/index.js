import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import NetworkMonitor from './components/NetworkMonitor';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('App crashed:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0f0d0c',
          color: '#fff', padding: 24, fontFamily: 'monospace',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
          <h1 style={{ marginBottom: 8, fontSize: 22 }}>Something went wrong</h1>
          <pre style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: 16, fontSize: 12, maxWidth: 600,
            overflowX: 'auto', color: '#fca5a5', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 20, padding: '12px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
          }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
          <BrowserRouter basename={process.env.PUBLIC_URL}>
            {/* Offline / unstable connection monitor — global */}
            <NetworkMonitor />
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(26, 22, 20, 0.95)',
                  color: '#f0ede8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  maxWidth: 380,
                },
                success: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);