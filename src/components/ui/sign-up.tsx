'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

interface SignUpPageProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    heroImageSrc?: string;
    onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
    onGoogleSignUp?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.FC<{ className?: string; style?: React.CSSProperties }> }) => (
    <div
        className="rounded-lg border transition-colors flex items-center"
        style={{
            borderColor: 'rgba(31, 82, 75, 0.3)',
            backgroundColor: 'rgba(31, 82, 75, 0.05)',
        }}
    >
        {Icon && (
            <div className="pl-4">
                <Icon className="w-5 h-5" style={{ color: '#666666' }} />
            </div>
        )}
        {children}
    </div>
);

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
    title = <span className="font-light tracking-tight">Create Account</span>,
    description = "Join 27 Estates and start your real estate journey",
    heroImageSrc = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80",
    onSignUp,
    onGoogleSignUp,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="min-h-screen flex flex-col md:flex-row w-full" style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
            {/* Left column: sign-up form */}
            <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    <div className="flex flex-col gap-5">
                        {/* Logo */}
                        <Link href="/" className="mb-2">
                            <span
                                className="text-2xl font-semibold"
                                style={{ color: 'var(--dark-turquoise, #1F524B)' }}
                            >
                                27 Estates
                            </span>
                        </Link>

                        <h1
                            className="text-3xl md:text-4xl font-semibold leading-tight"
                            style={{
                                fontFamily: 'var(--font-heading)',
                                color: '#1a1a1a'
                            }}
                        >
                            {title}
                        </h1>
                        <p style={{ color: '#666666' }}>{description}</p>

                        <form className="space-y-4" onSubmit={onSignUp}>
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="text-sm font-medium mb-2 block"
                                        style={{ color: '#666666' }}
                                    >
                                        First Name
                                    </label>
                                    <GlassInputWrapper icon={User}>
                                        <input
                                            name="firstName"
                                            type="text"
                                            placeholder="John"
                                            className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                                            style={{ color: '#1a1a1a' }}
                                            required
                                            data-testid="signup-first-name-input"
                                        />
                                    </GlassInputWrapper>
                                </div>
                                <div>
                                    <label
                                        className="text-sm font-medium mb-2 block"
                                        style={{ color: '#666666' }}
                                    >
                                        Last Name
                                    </label>
                                    <GlassInputWrapper>
                                        <input
                                            name="lastName"
                                            type="text"
                                            placeholder="Doe"
                                            className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                                            style={{ color: '#1a1a1a' }}
                                            required
                                            data-testid="signup-last-name-input"
                                        />
                                    </GlassInputWrapper>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    className="text-sm font-medium mb-2 block"
                                    style={{ color: '#666666' }}
                                >
                                    Email Address
                                </label>
                                <GlassInputWrapper icon={Mail}>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                                        style={{ color: '#1a1a1a' }}
                                        required
                                        data-testid="signup-email-input"
                                    />
                                </GlassInputWrapper>
                            </div>

                            {/* Phone */}
                            <div>
                                <label
                                    className="text-sm font-medium mb-2 block"
                                    style={{ color: '#666666' }}
                                >
                                    Phone Number (Optional)
                                </label>
                                <GlassInputWrapper icon={Phone}>
                                    <input
                                        name="phone"
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                                        style={{ color: '#1a1a1a' }}
                                        data-testid="signup-phone-input"
                                    />
                                </GlassInputWrapper>
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    className="text-sm font-medium mb-2 block"
                                    style={{ color: '#666666' }}
                                >
                                    Password
                                </label>
                                <GlassInputWrapper>
                                    <div className="relative w-full">
                                        <input
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
                                            style={{ color: '#1a1a1a' }}
                                            required
                                            data-testid="signup-password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-3 flex items-center"
                                            data-testid="signup-toggle-password"
                                        >
                                            {showPassword
                                                ? <EyeOff className="w-5 h-5" style={{ color: '#666666' }} />
                                                : <Eye className="w-5 h-5" style={{ color: '#666666' }} />
                                            }
                                        </button>
                                    </div>
                                </GlassInputWrapper>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    className="text-sm font-medium mb-2 block"
                                    style={{ color: '#666666' }}
                                >
                                    Confirm Password
                                </label>
                                <GlassInputWrapper>
                                    <div className="relative w-full">
                                        <input
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm your password"
                                            className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
                                            style={{ color: '#1a1a1a' }}
                                            required
                                            data-testid="signup-confirm-password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-3 flex items-center"
                                            data-testid="signup-toggle-confirm-password"
                                        >
                                            {showConfirmPassword
                                                ? <EyeOff className="w-5 h-5" style={{ color: '#666666' }} />
                                                : <Eye className="w-5 h-5" style={{ color: '#666666' }} />
                                            }
                                        </button>
                                    </div>
                                </GlassInputWrapper>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    name="terms"
                                    className="w-4 h-4 rounded mt-1"
                                    style={{ accentColor: 'var(--dark-turquoise, #1F524B)' }}
                                    required
                                    data-testid="signup-terms-checkbox"
                                />
                                <span className="text-sm" style={{ color: '#666666' }}>
                                    I agree to the{' '}
                                    <Link href="/terms" className="underline" style={{ color: 'var(--dark-turquoise, #1F524B)' }}>
                                        Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="underline" style={{ color: 'var(--dark-turquoise, #1F524B)' }}>
                                        Privacy Policy
                                    </Link>
                                </span>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg py-4 font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5"
                                style={{
                                    backgroundColor: 'var(--dark-turquoise, #1F524B)',
                                    color: '#ffffff',
                                }}
                                data-testid="signup-submit-button"
                            >
                                Create Account
                            </button>
                        </form>

                        <div className="relative flex items-center justify-center">
                            <span className="w-full border-t" style={{ borderColor: 'rgba(31, 82, 75, 0.2)' }}></span>
                            <span
                                className="px-4 text-sm absolute"
                                style={{
                                    color: '#666666',
                                    backgroundColor: 'var(--light-grey, #F6F6F5)'
                                }}
                            >
                                Or sign up with
                            </span>
                        </div>

                        <button
                            onClick={onGoogleSignUp}
                            className="w-full flex items-center justify-center gap-3 border rounded-lg py-4 transition-colors hover:bg-white/50"
                            style={{ borderColor: 'rgba(31, 82, 75, 0.3)' }}
                            data-testid="signup-google-button"
                        >
                            <GoogleIcon />
                            <span style={{ color: '#1a1a1a' }}>Continue with Google</span>
                        </button>

                        <p className="text-center text-sm" style={{ color: '#666666' }}>
                            Already have an account?{' '}
                            <Link
                                href="/auth/signin"
                                className="hover:underline transition-colors font-medium"
                                style={{ color: 'var(--dark-turquoise, #1F524B)' }}
                                data-testid="signup-signin-link"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* Right column: hero image */}
            <section className="hidden md:block flex-1 relative p-4">
                <div
                    className="absolute inset-4 rounded-2xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImageSrc})` }}
                >
                    {/* Overlay with branding */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Bottom content */}
                    <div className="absolute bottom-12 left-12 right-12">
                        <h2
                            className="text-3xl font-semibold text-white mb-4"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Find Your Dream Property
                        </h2>
                        <p className="text-white/80 text-lg">
                            Join thousands of satisfied customers who found their perfect home with 27 Estates.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SignUpPage;
