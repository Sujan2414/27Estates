'use client';

import React, { useState } from 'react';
import { SignUpPage } from '@/components/ui/sign-up';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPageRoute() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Sign up with Supabase
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`,
                        phone: phone || null,
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // Update profile in profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: `${firstName} ${lastName}`,
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone || null,
                    })
                    .eq('id', data.user.id);

                if (profileError) {
                    console.error('Error updating profile:', profileError);
                }

                // Redirect to intended page or dashboard
                const redirectTo = searchParams.get('redirect') || '/properties';
                router.push(redirectTo);
            }
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const redirectTo = searchParams.get('redirect') || '/properties';
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            console.error('Google sign up error:', err);
            setError(err.message || 'Failed to sign up with Google. Please try again.');
        }
    };

    return (
        <>
            <SignUpPage
                heroImageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80"
                onSignUp={handleSignUp}
                onGoogleSignUp={handleGoogleSignUp}
            />
            {error && (
                <div 
                    className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
                    data-testid="signup-error-message"
                >
                    {error}
                </div>
            )}
            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="signup-loading">
                    <div className="bg-white rounded-lg p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F524B] mx-auto"></div>
                        <p className="mt-4 text-center">Creating your account...</p>
                    </div>
                </div>
            )}
        </>
    );
}
