'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import Logo from "@/components/auth/Logo";
import AuthFooter from "@/components/auth/AuthFooter";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const supabase = createClient();

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setToast(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;
            setToast({ message: `Password reset link sent to ${email}`, type: 'success' });
            setEmail("");
        } catch (err: any) {
            console.error('Reset password error:', err);
            setToast({ message: err.message || 'Failed to send reset email. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Logo />

            <h2 className="text-2xl font-semibold text-foreground mb-8">Forgot Password</h2>

            <p style={{ color: '#777', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="auth-input"
                    required
                />

                <button
                    type="submit"
                    className="auth-button"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <p className="mt-8 text-foreground">
                Remember your password?{" "}
                <Link href="/auth/signin" className="font-medium hover:underline">
                    Log in
                </Link>
            </p>

            <AuthFooter />

            {/* Bottom-left toast notification */}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9999,
                        maxWidth: '400px',
                        padding: '14px 20px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        lineHeight: 1.4,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        animation: 'slideInToast 0.3s ease-out',
                        background: toast.type === 'success' ? '#f0f0f0' : '#fef2f2',
                        color: toast.type === 'success' ? '#333' : '#b91c1c',
                        border: toast.type === 'success' ? '1px solid #ddd' : '1px solid #fecaca',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{toast.type === 'success' ? '✓' : '!'}</span>
                        <span>{toast.message}</span>
                        <button
                            onClick={() => setToast(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: 'inherit',
                                opacity: 0.6,
                                padding: '0 4px',
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideInToast {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </AuthLayout>
    );
}
