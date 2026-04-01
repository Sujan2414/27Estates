'use client';

import { useState, Suspense, useEffect } from "react";
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
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        if (searchParams?.get("error") === "Verification_Failed") {
            setError("This email confirmation link has expired or is invalid. If you requested a new one, please use the most recent email. Otherwise, try signing in.");
        }
    }, [searchParams]);

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
                // Always persist session cookie; "Remember Me" is default on
                await fetch('/api/auth/session', { method: 'POST' });

                // Sync profile row — use UPDATE for existing users to preserve role,
                // INSERT only for brand-new profiles (edge case)
                const meta = data.user.user_metadata || {};
                const profilePayload = {
                    email: data.user.email || null,
                    full_name: meta.full_name || null,
                    first_name: meta.first_name || null,
                    last_name: meta.last_name || null,
                    phone: meta.phone || null,
                    updated_at: new Date().toISOString(),
                };

                // Try update first (preserves existing role)
                const { data: updated } = await supabase
                    .from('profiles')
                    .update(profilePayload)
                    .eq('id', data.user.id)
                    .select('id')
                    .single();

                // If no row existed, insert with default role
                if (!updated) {
                    await supabase.from('profiles').insert({
                        id: data.user.id,
                        ...profilePayload,
                        role: 'user',
                    }).then(({ error }) => {
                        if (error) console.error('Profile insert error:', error);
                    });
                }

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

            <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground mb-6" style={{ textAlign: 'center', fontSize: '0.9375rem', color: '#6b7280' }}>Sign in to your account</p>

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

                <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0 20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#555', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--dark-turquoise, #183C38)', cursor: 'pointer' }}
                        />
                        Remember me
                    </label>
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/signup" className="font-medium hover:underline" style={{ color: '#183C38', fontWeight: 600 }}>
                        Sign up
                    </Link>
                </p>
            </div>

            <AuthFooter />
        </AuthLayout>
    );
}
