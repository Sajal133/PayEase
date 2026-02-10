import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
