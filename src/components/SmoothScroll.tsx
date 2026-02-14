'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const lenisRef = useRef<Lenis | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Disable Lenis on /properties, /auth, and /admin pages
        if (pathname?.startsWith('/properties') || pathname?.startsWith('/auth') || pathname?.startsWith('/admin')) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;
        (window as any).lenis = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [pathname]);

    return <>{children}</>;
};

export default SmoothScroll;
