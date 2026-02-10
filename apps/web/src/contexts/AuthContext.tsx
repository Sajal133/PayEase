import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

type Company = Database['public']['Tables']['companies']['Row'];

// ============================================================================
// Types
// ============================================================================

interface AuthState {
    user: User | null;
    session: Session | null;
    company: Company | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, companyName: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    updateProfile: (data: Partial<Company>) => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        company: null,
        loading: true,
        error: null,
    });

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadCompany(session.user.id);
            }
            setState(prev => ({
                ...prev,
                user: session?.user ?? null,
                session,
                loading: false,
            }));
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setState(prev => ({
                    ...prev,
                    user: session?.user ?? null,
                    session,
                }));

                if (session?.user) {
                    loadCompany(session.user.id);
                } else {
                    setState(prev => ({ ...prev, company: null }));
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Load company data for user
    async function loadCompany(userId: string) {
        try {
            // First, try to find company where user is the owner
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading company:', error);
            }

            setState(prev => ({ ...prev, company: data }));
        } catch (err) {
            console.error('Error loading company:', err);
        }
    }

    // Sign in with email/password
    async function signIn(email: string, password: string) {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setState(prev => ({
            ...prev,
            loading: false,
            error: error?.message || null,
        }));

        return { error };
    }

    // Sign up with email/password
    async function signUp(email: string, password: string, companyName: string) {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: authError.message,
            }));
            return { error: authError };
        }

        // Create company record
        if (authData.user) {
            const { error: companyError } = await supabase
                .from('companies')
                .insert({
                    name: companyName,
                    email: email,
                });

            if (companyError) {
                console.error('Error creating company:', companyError);
            }
        }

        setState(prev => ({ ...prev, loading: false }));
        return { error: null };
    }

    // Sign out
    async function signOut() {
        setState(prev => ({ ...prev, loading: true }));
        await supabase.auth.signOut();
        setState({
            user: null,
            session: null,
            company: null,
            loading: false,
            error: null,
        });
    }

    // Reset password
    async function resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error };
    }

    // Update company profile
    async function updateProfile(data: Partial<Company>) {
        if (!state.company) return;

        const { error } = await supabase
            .from('companies')
            .update(data)
            .eq('id', state.company.id);

        if (!error) {
            setState(prev => ({
                ...prev,
                company: { ...prev.company!, ...data },
            }));
        }
    }

    const value: AuthContextType = {
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to login or show fallback
        if (fallback) return <>{fallback}</>;
        window.location.href = '/auth/login';
        return null;
    }

    return <>{children}</>;
}

export default AuthContext;
