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

    // Check auth session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    const handleContinueAsGuest = useCallback(() => {
        router.push(redirectPath);
    }, [router, redirectPath]);

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
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
