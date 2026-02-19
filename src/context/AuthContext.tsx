'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AuthModal } from '@/components/ui/auth-modal';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    loading: boolean;
    showAuthModal: (redirectPath?: string) => void;
    hideAuthModal: () => void;
    checkAuthAndNavigate: (path: string) => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/properties');
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    // Check auth session on mount, handle "remember me" logic
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const rememberMe = localStorage.getItem('rememberMe');
                    const sessionActive = sessionStorage.getItem('session_active');

                    if (!rememberMe && !sessionActive) {
                        // Browser was closed and reopened without "Remember Me"
                        // Sign out to enforce session-only persistence
                        await supabase.auth.signOut();
                        setUser(null);
                        setLoading(false);
                        return;
                    }

                    // Mark this browser tab/window as having an active session
                    sessionStorage.setItem('session_active', 'true');
                    setUser(session.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                sessionStorage.setItem('session_active', 'true');
            }
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const showAuthModal = useCallback((path: string = '/properties') => {
        setRedirectPath(path);
        setIsModalOpen(true);
    }, []);

    const hideAuthModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const checkAuthAndNavigate = useCallback((path: string) => {
        if (user) {
            router.push(path);
        } else {
            showAuthModal(path);
        }
    }, [user, router, showAuthModal]);

    const handleContinueAsGuest = useCallback(async () => {
        // Sign out any existing session so the user is truly a guest
        try {
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('rememberMe');
            sessionStorage.removeItem('session_active');
        } catch (error) {
            console.error('Error signing out for guest mode:', error);
        }
        router.push(redirectPath);
    }, [supabase.auth, router, redirectPath]);

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('rememberMe');
            sessionStorage.removeItem('session_active');
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, [supabase.auth, router]);

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            loading,
            showAuthModal,
            hideAuthModal,
            checkAuthAndNavigate,
            signOut
        }}>
            {children}
            <AuthModal
                isOpen={isModalOpen}
                onClose={hideAuthModal}
                onContinueAsGuest={handleContinueAsGuest}
                redirectPath={redirectPath}
            />
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Hook for protected navigation
export function useProtectedNavigation() {
    const { checkAuthAndNavigate } = useAuth();
    return checkAuthAndNavigate;
}
