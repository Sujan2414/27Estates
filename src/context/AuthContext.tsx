'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AuthModal } from '@/components/ui/auth-modal';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    isLoggedIn: boolean;
    showAuthModal: (redirectPath?: string) => void;
    hideAuthModal: () => void;
    checkAuthAndNavigate: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/properties');
    const [isLoggedIn] = useState(false); // TODO: Implement actual auth check
    const router = useRouter();

    const showAuthModal = useCallback((path: string = '/properties') => {
        setRedirectPath(path);
        setIsModalOpen(true);
    }, []);

    const hideAuthModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const checkAuthAndNavigate = useCallback((path: string) => {
        if (isLoggedIn) {
            router.push(path);
        } else {
            showAuthModal(path);
        }
    }, [isLoggedIn, router, showAuthModal]);

    const handleContinueAsGuest = useCallback(() => {
        router.push(redirectPath);
    }, [router, redirectPath]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, showAuthModal, hideAuthModal, checkAuthAndNavigate }}>
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
