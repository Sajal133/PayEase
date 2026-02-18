import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Global styles first, then component styles
import './styles/global.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/employees.css';
import './styles/payroll.css';
import './styles/payslips.css';
import './styles/calendar.css';
import './styles/onboarding.css';

// ── Sentry Error Tracking ──────────────────────────────────────────────────
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
    });
}

// ── Fallback UI for Sentry Error Boundary ──────────────────────────────────
function FallbackUI() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>The error has been reported. Please refresh the page.</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Sentry.ErrorBoundary fallback={<FallbackUI />}>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </Sentry.ErrorBoundary>
    </React.StrictMode>
);
