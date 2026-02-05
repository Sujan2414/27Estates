'use client';

import React from 'react';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';
import { useRouter } from 'next/navigation';

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

    const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log("Sign In submitted:", data);
        // TODO: Implement actual authentication
        router.push('/dashboard');
    };

    const handleGoogleSignIn = () => {
        console.log("Continue with Google clicked");
        // TODO: Implement Google OAuth
    };

    const handleResetPassword = () => {
        router.push('/auth/reset-password');
    };

    return (
        <SignInPage
            heroImageSrc="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80"
            testimonials={testimonials}
            onSignIn={handleSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            onResetPassword={handleResetPassword}
        />
    );
}
