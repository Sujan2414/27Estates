'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
                        className="fixed inset-0 bg-black/50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] px-8 pt-8 pb-10 relative"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Logo - Small */}
                            <div className="flex items-center gap-2 mb-5">
                                <div
                                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: 'var(--dark-turquoise, #1F524B)' }}
                                >
                                    27
                                </div>
                                <span
                                    className="text-base font-semibold"
                                    style={{ color: '#1a1a1a' }}
                                >
                                    27 Estates
                                </span>
                            </div>

                            {/* Title */}
                            <h2
                                className="text-2xl font-medium mb-8"
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                    color: '#1a1a1a'
                                }}
                            >
                                Select any option to continue
                            </h2>

                            {/* Inner Card Container */}
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #f0f0f0'
                                }}
                            >
                                {/* Buttons Row */}
                                <div className="flex gap-3 mb-6">
                                    {/* Sign Up Button */}
                                    <Link
                                        href={`/auth/signup?redirect=${encodeURIComponent(redirectPath)}`}
                                        className="flex-1 py-3 rounded-lg text-center font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                        style={{ backgroundColor: 'var(--dark-turquoise, #1F524B)' }}
                                        onClick={onClose}
                                    >
                                        Sign up
                                    </Link>

                                    {/* Log In Button */}
                                    <Link
                                        href={`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`}
                                        className="flex-1 py-3 rounded-lg text-center font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                        style={{ backgroundColor: '#1a1a1a' }}
                                        onClick={onClose}
                                    >
                                        Log in
                                    </Link>
                                </div>

                                {/* Divider */}
                                <div className="relative flex items-center justify-center mb-6">
                                    <div className="w-full border-t" style={{ borderColor: '#e5e5e5' }}></div>
                                    <span
                                        className="absolute px-3 text-xs"
                                        style={{ backgroundColor: '#fafafa', color: '#999' }}
                                    >
                                        or
                                    </span>
                                </div>

                                {/* Continue as Guest */}
                                <button
                                    onClick={handleContinueAsGuest}
                                    className="w-full py-3 rounded-lg text-center font-medium text-sm transition-all hover:bg-gray-100 active:scale-[0.98]"
                                    style={{
                                        border: '1px solid #e0e0e0',
                                        color: '#1a1a1a',
                                        backgroundColor: '#ffffff'
                                    }}
                                >
                                    Continue as guest
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
