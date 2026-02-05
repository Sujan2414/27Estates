'use client';

import React from 'react';
import { SignUpPage } from '@/components/ui/sign-up';
import { useRouter } from 'next/navigation';

export default function SignUpPageRoute() {
    const router = useRouter();

    const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log("Sign Up submitted:", data);
        // TODO: Implement actual registration
        router.push('/dashboard');
    };

    const handleGoogleSignUp = () => {
        console.log("Continue with Google clicked");
        // TODO: Implement Google OAuth
    };

    return (
        <SignUpPage
            heroImageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80"
            onSignUp={handleSignUp}
            onGoogleSignUp={handleGoogleSignUp}
        />
    );
}
