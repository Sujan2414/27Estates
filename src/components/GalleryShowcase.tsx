'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ZoomParallax } from "@/components/ui/zoom-parallax";

// Real estate focused images for 27 Estates - matching layout pattern
const images = [
    {
        // Index 0: CENTER (main focus)
        src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80',
        alt: 'Luxury modern villa with pool',
    },
    {
        // Index 1: TOP RIGHT
        src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Elegant home exterior',
    },
    {
        // Index 2: TOP LEFT
        src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Modern living room interior',
    },
    {
        // Index 3: RIGHT
        src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Luxury apartment building',
    },
    {
        // Index 4: BOTTOM CENTER-RIGHT
        src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Premium home with garden',
    },
    {
        // Index 5: BOTTOM LEFT
        src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Contemporary kitchen design',
    },
    {
        // Index 6: BOTTOM RIGHT
        src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Stunning pool and exterior',
    },
];

export default function GalleryShowcase() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return (
        <section className="relative">
            {/* Header Section */}
            <div style={{ padding: isMobile ? '4rem 0 2rem' : '6rem 0 4rem', backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
                <div style={{ textAlign: 'center', maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)' }}>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase' as const,
                        color: 'var(--gold, #BFA270)',
                        marginBottom: '1rem'
                    }}>
                        Our Portfolio
                    </p>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                        fontWeight: 500,
                        letterSpacing: '-0.02em',
                        color: 'var(--dark-turquoise, #1F524B)',
                        marginBottom: '1rem'
                    }}>
                        Curated Excellence
                    </h2>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.7,
                        color: 'var(--dark-grey, #0E110F)',
                        maxWidth: '500px',
                        margin: '0 auto'
                    }}>
                        Explore our handpicked collection of premium properties across Bangalore.
                    </p>

                    {/* Mobile-only CTA - replaces the parallax animation */}
                    {isMobile && (
                        <div style={{ marginTop: '2rem', paddingBottom: '1rem' }}>
                            <Link
                                href="/contact"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.875rem 2rem',
                                    backgroundColor: 'var(--dark-turquoise, #1F524B)',
                                    color: '#ffffff',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase' as const,
                                    textDecoration: 'none',
                                    border: '1px solid var(--dark-turquoise, #1F524B)',
                                    borderRadius: '4px',
                                }}
                            >
                                Get In Touch
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Parallax Gallery - desktop only */}
            {!isMobile && <ZoomParallax images={images} />}
        </section>
    );
}
