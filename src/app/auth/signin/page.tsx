'use client';

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Logo from "@/components/auth/Logo";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthFooter from "@/components/auth/AuthFooter";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }

                // Sync profile — ensure user's profile row exists with correct data
                const meta = data.user.user_metadata || {};
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: data.user.email || null,
                    full_name: meta.full_name || null,
                    first_name: meta.first_name || null,
                    last_name: meta.last_name || null,
                    phone: meta.phone || null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' }).then(({ error }) => {
                    if (error) console.error('Profile sync error:', error);
                });

                const redirectTo = searchParams?.get('redirect') || '/properties';
                router.push(redirectTo);
            }
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Logo />

            <h2 className="text-2xl font-semibold mb-8 text-foreground">Welcome Back!</h2>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email or Phone"
                    className="auth-input"
                    required
                />

                <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Password"
                />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    margin: '12px 0 20px',
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#555',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                    }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{
                                width: '16px',
                                height: '16px',
                                accentColor: 'var(--dark-turquoise, #1F524B)',
                                cursor: 'pointer',
                            }}
                        />
                        Remember me
                    </label>
                </div>

                <button
                    type="submit"
                    className="auth-button"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="flex justify-between items-center" style={{ marginTop: '32px' }}>
                <Link href="/auth/signup" className="font-medium hover:underline text-foreground">
                    Create account
                </Link>
                <Link href="/auth/forgot-password" className="font-medium hover:underline text-foreground">
                    Forgot password?
                </Link>
            </div>

            <AuthFooter />
        </AuthLayout>
    );
}
