import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
    const { signIn, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLocalError(null);

        if (!email || !password) {
            setLocalError('Please enter both email and password');
            return;
        }

        const { error } = await signIn(email, password);

        if (!error) {
            window.location.href = '/dashboard';
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>PayEase</h1>
                    <p>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {(error || localError) && (
                        <div className="error-message">{error || localError}</div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <a href="/auth/forgot-password">Forgot password?</a>
                    <span className="divider">•</span>
                    <a href="/auth/signup">Create account</a>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
