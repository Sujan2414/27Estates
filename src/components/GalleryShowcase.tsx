'use client';

import { useState, useEffect } from 'react';
import { ZoomParallax } from "@/components/ui/zoom-parallax";

// Real estate focused images for 27 Estates - matching layout pattern
const images = [
    {
        src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80',
        alt: 'Luxury modern villa with pool',
    },
    {
        src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Elegant home exterior',
    },
    {
        src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Modern living room interior',
    },
    {
        src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Luxury apartment building',
    },
    {
        src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Premium home with garden',
    },
    {
        src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
        alt: 'Contemporary kitchen design',
    },
    {
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

    // On mobile: render nothing — the ContactCTA that follows will show directly
    if (isMobile) return null;

    return (
        <section className="relative">
            {/* Header Section */}
            <div style={{ padding: '6rem 0 4rem', backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
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
                        color: 'var(--dark-turquoise, #183C38)',
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
                </div>
            </div>

            {/* Parallax Gallery - desktop only */}
            <ZoomParallax images={images} />
        </section>
    );
}
