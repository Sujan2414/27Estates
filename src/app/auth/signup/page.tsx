'use client';

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Logo from "@/components/auth/Logo";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import AuthFooter from "@/components/auth/AuthFooter";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignUpContent />
        </Suspense>
    );
}

function SignUpContent() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // Validate password requirements
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
            setError("Please ensure your password meets all requirements.");
            return;
        }

        setLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`.trim(),
                        phone: phone,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${searchParams?.get('redirect') || '/properties'}`,
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // Check if email confirmation is required
                if (data.session) {
                    // No email confirmation needed — redirect immediately
                    const redirectTo = searchParams?.get('redirect') || '/properties';
                    sessionStorage.setItem('session_active', 'true');
                    router.push(redirectTo);
                } else {
                    // Email confirmation required — show "check your email" message
                    setEmailSent(true);
                }
            }
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Logo />

            {emailSent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Check your email</h2>
                    <p style={{ color: '#666', marginBottom: '8px', fontSize: '0.95rem' }}>
                        We&apos;ve sent a confirmation link to
                    </p>
                    <p style={{ fontWeight: 600, color: '#183C38', marginBottom: '24px', fontSize: '1rem' }}>
                        {email}
                    </p>
                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '32px' }}>
                        Please click the link in your email to verify your account, then sign in.
                    </p>
                    <Link
                        href="/auth/signin"
                        className="auth-button block text-center no-underline hover:opacity-90 transition-opacity"
                        style={{ display: 'block', textDecoration: 'none' }}
                    >
                        Go to Sign In
                    </Link>
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-semibold mb-6 text-foreground">Sign Up</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-4 w-full" style={{ marginBottom: '12px' }}>
                            <div className="w-1/2">
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First name"
                                    className="auth-input"
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last name"
                                    className="auth-input"
                                    required
                                />
                            </div>
                        </div>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="auth-input"
                            required
                        />

                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone Number"
                            className="auth-input"
                        />

                        <PasswordInput
                            value={password}
                            onChange={setPassword}
                            placeholder="Password"
                        />

                        <PasswordInput
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm Password"
                        />

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px' }}>
                        <PasswordRequirements password={password} />
                    </div>

                    <p className="mt-5 text-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/signin" className="font-medium hover:underline text-foreground">
                            Log in
                        </Link>
                    </p>

                    <AuthFooter />
                </>
            )}
        </AuthLayout>
    );
}
