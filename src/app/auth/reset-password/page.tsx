'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Logo from "@/components/auth/Logo";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import AuthFooter from "@/components/auth/AuthFooter";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionReady, setSessionReady] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Supabase PKCE flow sends a ?code= parameter that must be exchanged for a session
    useEffect(() => {
        const establishSession = async () => {
            try {
                // 1. Check for PKCE code in URL (Supabase SSR / PKCE flow)
                const code = searchParams?.get('code');
                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (!exchangeError) {
                        setSessionReady(true);
                        return;
                    }
                    console.error('Code exchange error:', exchangeError);
                }

                // 2. Check if session already exists (e.g. hash fragment flow)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setSessionReady(true);
                    return;
                }

                // 3. Listen for auth state change as fallback
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
                    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                        setSessionReady(true);
                    }
                });

                // Clean up after 15 seconds
                setTimeout(() => subscription.unsubscribe(), 15000);
            } catch (err) {
                console.error('Session establishment error:', err);
                setError('Failed to verify your reset link. Please request a new one.');
            }
        };
        establishSession();
    }, [supabase.auth, searchParams]);

    const allRequirementsMet =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!allRequirementsMet) {
            setError("Please meet all password requirements.");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) throw updateError;
            setSuccess(true);

            // Redirect to properties after 3 seconds
            setTimeout(() => {
                router.push('/properties');
            }, 3000);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Logo />

            <h2 className="text-2xl font-semibold text-foreground mb-8">Set New Password</h2>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {success ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
                    <p className="font-medium mb-2">Password updated successfully!</p>
                    <p className="text-sm">You will be redirected to the dashboard shortly...</p>
                </div>
            ) : !sessionReady ? (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
                    <p className="font-medium mb-2">Verifying your reset link...</p>
                    <p className="text-sm">If this takes too long, please request a new reset link from the <a href="/auth/forgot-password" className="underline">forgot password page</a>.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <PasswordInput
                        value={password}
                        onChange={setPassword}
                        placeholder="New Password"
                    />

                    <PasswordInput
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Confirm New Password"
                    />

                    {password.length > 0 && (
                        <PasswordRequirements password={password} />
                    )}

                    {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-red-500 text-sm">Passwords do not match</p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading || !allRequirementsMet || password !== confirmPassword}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            )}

            <AuthFooter />
        </AuthLayout>
    );
}
