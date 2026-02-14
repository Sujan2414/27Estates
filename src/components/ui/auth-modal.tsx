'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinueAsGuest?: () => void;
    redirectPath?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    onContinueAsGuest,
    redirectPath = '/properties',
}) => {
    const scrollPositionRef = useRef(0);

    // STRONG scroll lock
    useEffect(() => {
        if (isOpen) {
            scrollPositionRef.current = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollPositionRef.current}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            document.documentElement.classList.add('lenis-stopped');
            if (typeof window !== 'undefined' && (window as any).lenis) {
                (window as any).lenis.stop();
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
            document.documentElement.classList.remove('lenis-stopped');
            if (typeof window !== 'undefined' && (window as any).lenis) {
                (window as any).lenis.start();
            }
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.documentElement.classList.remove('lenis-stopped');
            if (typeof window !== 'undefined' && (window as any).lenis) {
                (window as any).lenis.start();
            }
        };
    }, [isOpen]);

    const handleContinueAsGuest = () => {
        onClose();
        onContinueAsGuest?.();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        data-lenis-prevent
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            zIndex: 9999,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        data-lenis-prevent
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Modal Box */}
                        <motion.div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 25px 80px -15px rgba(0, 0, 0, 0.35)',
                                width: '90vw',
                                maxWidth: '520px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            initial={{ scale: 0.9, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 40, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button - Top Right */}
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    right: '24px',
                                    top: '24px',
                                    zIndex: 10,
                                    padding: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f3f4f6',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                aria-label="Close"
                            >
                                <X style={{ width: '18px', height: '18px', color: '#6b7280' }} />
                            </button>

                            {/* Content Area */}
                            <div style={{
                                padding: '56px 48px 48px 48px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                            }}>
                                {/* Logo */}
                                <div style={{
                                    marginBottom: '32px',
                                    position: 'relative',
                                    width: '140px',
                                    height: '40px'
                                }}>
                                    <Image
                                        src="/logo-trimmed.png"
                                        alt="27 Estates"
                                        fill
                                        style={{ objectFit: 'contain', objectPosition: 'left' }}
                                        priority
                                    />
                                </div>

                                {/* Heading */}
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    lineHeight: 1.3,
                                    fontWeight: 500,
                                    color: '#1a1a1a',
                                    marginBottom: '40px',
                                    fontFamily: 'var(--font-heading)',
                                }}>
                                    Select any option to continue
                                </h2>

                                {/* Inner Card Container */}
                                <div style={{
                                    width: '100%',
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '8px',
                                    padding: '32px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                }}>
                                    {/* Auth Buttons Row */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                                        {/* Sign Up Button - Brand Color */}
                                        <Link
                                            href={`/auth/signup?redirect=${encodeURIComponent(redirectPath)}`}
                                            style={{
                                                flex: 1,
                                                height: '48px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#1F524B',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '15px',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={onClose}
                                        >
                                            Sign up
                                        </Link>

                                        {/* Log In Button - BLACK */}
                                        <Link
                                            href={`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`}
                                            style={{
                                                flex: 1,
                                                height: '48px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#1a1a1a',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '15px',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={onClose}
                                        >
                                            Log in
                                        </Link>
                                    </div>

                                    {/* Divider */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        marginBottom: '32px'
                                    }}>
                                        <div style={{ flex: 1, height: '1px', backgroundColor: '#000000' }} />
                                        <span style={{ color: '#999', fontSize: '13px' }}>or</span>
                                        <div style={{ flex: 1, height: '1px', backgroundColor: '#000000' }} />
                                    </div>

                                    {/* Continue as Guest Button */}
                                    <button
                                        onClick={handleContinueAsGuest}
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                            fontWeight: 500,
                                            fontSize: '15px',
                                            color: '#1a1a1a',
                                            borderRadius: '6px',
                                            border: '1px solid #1a1a1a',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Continue as guest
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
