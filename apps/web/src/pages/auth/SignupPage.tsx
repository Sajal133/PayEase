import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function SignupPage() {
    const { signUp, loading, error } = useAuth();
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLocalError(null);

        // Validation
        if (!companyName || !email || !password) {
            setLocalError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }

        const { error } = await signUp(email, password, companyName);

        if (!error) {
            setSuccess(true);
        }
    }

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header success">
                        <span className="success-icon">✓</span>
                        <h1>Check your email</h1>
                        <p>We've sent a verification link to <strong>{email}</strong></p>
                    </div>
                    <div className="auth-footer">
                        <a href="/auth/login">Back to Sign In</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>PayEase</h1>
                    <p>Create your account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {(error || localError) && (
                        <div className="error-message">{error || localError}</div>
                    )}

                    <div className="form-group">
                        <label htmlFor="companyName">Company Name</label>
                        <input
                            type="text"
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Acme Corporation"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Work Email</label>
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
                            placeholder="Min 8 characters"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <p className="terms">
                        By signing up, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
                    </p>
                </form>

                <div className="auth-footer">
                    Already have an account? <a href="/auth/login">Sign In</a>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;
