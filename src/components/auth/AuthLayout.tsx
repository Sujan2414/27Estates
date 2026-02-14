'use client';

import './auth.css';
import { useEffect } from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    // Lock body scroll to prevent any global scrolling
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div className="auth-page-root h-screen w-full overflow-hidden flex" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Left Panel - Image Cover */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted">
                <img
                    src="/auth-cover.png"
                    alt="27 Estates Property Listing"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Right Panel - Auth Form */}
            <div
                className="w-full lg:w-1/2 relative h-screen flex flex-col"
                style={{ backgroundColor: '#ffffff' }}
            >
                <div className="auth-form-container flex-1 flex items-center justify-center overflow-y-auto py-6">
                    <div className="max-w-[540px] mx-auto w-full px-4 my-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
