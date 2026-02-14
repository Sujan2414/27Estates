'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthPromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onContinueAsGuest?: () => void;
}

export const AuthPromptDialog = ({
    open,
    onOpenChange,
    onContinueAsGuest,
}: AuthPromptDialogProps) => {
    const router = useRouter();
    const scrollPositionRef = useRef(0);

    // STRONGER scroll lock - prevents ALL scrolling when modal is open
    useEffect(() => {
        if (open) {
            // Save current scroll position
            scrollPositionRef.current = window.scrollY;

            // Lock body scroll completely
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollPositionRef.current}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';

            // Stop Lenis smooth scroll if present
            document.documentElement.classList.add('lenis-stopped');

            // Access Lenis instance directly via window (now exposed by SmoothScroll)
            if (typeof window !== 'undefined' && (window as any).lenis) {
                (window as any).lenis.stop();
            }
        } else {
            // Restore scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';

            // Restore scroll position
            window.scrollTo(0, scrollPositionRef.current);

            // Resume Lenis
            document.documentElement.classList.remove('lenis-stopped');
            if (typeof window !== 'undefined' && (window as any).lenis) {
                (window as any).lenis.start();
            }
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.documentElement.classList.remove('lenis-stopped');
            if (typeof window !== 'undefined' && (window as any).lenis) {
                (window as any).lenis.start();
            }
        };
    }, [open]);

    const handleSignUp = () => {
        onOpenChange(false);
        router.push("/auth/signup");
    };

    const handleLogIn = () => {
        onOpenChange(false);
        router.push("/auth/signin");
    };

    const handleContinueAsGuest = () => {
        onOpenChange(false);
        onContinueAsGuest?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                data-lenis-prevent
                style={{
                    width: '90vw',
                    maxWidth: '800px',
                    minHeight: '550px',
                    padding: 0,
                    borderRadius: '32px',
                    border: 'none',
                    boxShadow: '0 32px 100px -20px rgba(0,0,0,0.4)',
                    backgroundColor: 'white',
                    overflow: 'hidden',
                }}
                className="[&>button]:hidden"
            >
                {/* Close Button - Top Left */}
                <button
                    onClick={() => onOpenChange(false)}
                    style={{
                        position: 'absolute',
                        left: '40px',
                        top: '40px',
                        zIndex: 50,
                        padding: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    aria-label="Close"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                >
                    <X style={{ width: '24px', height: '24px', color: '#4b5563' }} />
                </button>

                {/* Main Content Container - MAXIMUM SPACE */}
                <div style={{
                    padding: '96px 80px 64px 80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                }}>

                    {/* Logo Area - BIG */}
                    <div style={{
                        marginBottom: '48px',
                        position: 'relative',
                        width: '200px',
                        height: '60px'
                    }}>
                        <Image
                            src="/logo-trimmed.png"
                            alt="27 Estates"
                            fill
                            style={{ objectFit: 'contain', objectPosition: 'left' }}
                            priority
                        />
                    </div>

                    {/* Heading - LARGE and prominent */}
                    <h2 style={{
                        fontSize: '2.5rem',
                        lineHeight: 1.15,
                        fontWeight: 600,
                        color: '#0E110F',
                        marginBottom: '56px',
                        letterSpacing: '-0.02em',
                    }}>
                        Select any option to continue
                    </h2>

                    {/* Inner Card Container - The rounded box with buttons */}
                    <div style={{
                        width: '100%',
                        backgroundColor: '#F8F8F8',
                        border: '1px solid #E8E8E8',
                        borderRadius: '28px',
                        padding: '48px',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
                    }}>

                        {/* Auth Buttons Row */}
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '48px' }}>
                            <Button
                                onClick={handleSignUp}
                                style={{
                                    flex: 1,
                                    height: '60px',
                                    backgroundColor: '#FF6D3F',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '18px',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 24px rgba(255,109,63,0.35)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                className="hover:bg-[#E85830] hover:-translate-y-1 active:scale-[0.98]"
                            >
                                Sign up
                            </Button>
                            <Button
                                onClick={handleLogIn}
                                style={{
                                    flex: 1,
                                    height: '60px',
                                    backgroundColor: '#1A1A1A',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '18px',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                className="hover:bg-black hover:-translate-y-1 active:scale-[0.98]"
                            >
                                Log in
                            </Button>
                        </div>

                        {/* Divider with "or" */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '32px',
                            marginBottom: '48px'
                        }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }} />
                            <span style={{ color: '#6b7280', fontSize: '16px', fontWeight: 500 }}>or</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }} />
                        </div>

                        {/* Continue as Guest Button */}
                        <Button
                            variant="outline"
                            onClick={handleContinueAsGuest}
                            style={{
                                width: '100%',
                                height: '60px',
                                fontWeight: 600,
                                fontSize: '17px',
                                color: '#1A1A1A',
                                borderRadius: '16px',
                                border: '2px solid #d1d5db',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            className="hover:bg-gray-50 hover:border-gray-400 active:scale-[0.99]"
                        >
                            Continue as guest
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthPromptDialog;
