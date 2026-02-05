'use client';

import React, { useState } from 'react';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const testimonials: Testimonial[] = [
    {
        avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
        name: "Priya Sharma",
        handle: "@priyasharma",
        text: "Found my dream villa through 27 Estates. The team was incredibly professional!"
    },
    {
        avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
        name: "Rahul Menon",
        handle: "@rahulmenon",
        text: "Best real estate platform in Bangalore. Transparent and trustworthy."
    },
];

export default function SignInPageRoute() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                // Redirect to intended page or dashboard
                const redirectTo = searchParams.get('redirect') || '/properties';
                router.push(redirectTo);
            }
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
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
            console.error('Google sign in error:', err);
            setError(err.message || 'Failed to sign in with Google. Please try again.');
        }
    };

    const handleResetPassword = () => {
        router.push('/auth/reset-password');
    };

    return (
        <>
            <SignInPage
                heroImageSrc="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80"
                testimonials={testimonials}
                onSignIn={handleSignIn}
                onGoogleSignIn={handleGoogleSignIn}
                onResetPassword={handleResetPassword}
            />
            {error && (
                <div 
                    className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
                    data-testid="signin-error-message"
                >
                    {error}
                </div>
            )}
            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="signin-loading">
                    <div className="bg-white rounded-lg p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F524B] mx-auto"></div>
                        <p className="mt-4 text-center">Signing you in...</p>
                    </div>
                </div>
            )}
        </>
    );
}
