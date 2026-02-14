'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Framer-style page transition using an overlay curtain.
 *
 * 1. User clicks any internal link
 * 2. Dark overlay fades in, covering the current page
 * 3. Once fully opaque → scroll to top + navigate (invisible to user)
 * 4. New page renders behind the overlay
 * 5. Overlay fades out, content slides up — revealing the new page
 */

type Phase = 'idle' | 'covering' | 'covered' | 'revealing';

export default function NavigationTransition({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [phase, setPhase] = useState<Phase>('idle');
    const prevPathRef = useRef(pathname);
    const pendingHref = useRef<string | null>(null);
    const navigatingRef = useRef(false);

    // PHASE: covering → after overlay fully opaque, scroll + navigate
    useEffect(() => {
        if (phase !== 'covering') return;
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
            if (pendingHref.current) {
                router.push(pendingHref.current, { scroll: false });
            }
            setPhase('covered');
        }, 450);
        return () => clearTimeout(timer);
    }, [phase, router]);

    // PHASE: revealing → after overlay faded out, go idle
    useEffect(() => {
        if (phase !== 'revealing') return;
        const timer = setTimeout(() => setPhase('idle'), 600);
        return () => clearTimeout(timer);
    }, [phase]);

    // When pathname changes (new page loaded) → start revealing
    useEffect(() => {
        if (prevPathRef.current !== pathname) {
            prevPathRef.current = pathname;
            navigatingRef.current = false;
            pendingHref.current = null;
            // Let new page render one frame, then start overlay fade-out
            requestAnimationFrame(() => setPhase('revealing'));
        }
    }, [pathname]);

    // Intercept ALL internal link clicks
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Only intercept internal page links
            if (!href.startsWith('/')) return;
            if (href === '#' || href.startsWith('/#')) return;
            if (anchor.target === '_blank') return;
            if (anchor.hasAttribute('download')) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            // Same page
            const cleanHref = href.split('?')[0].split('#')[0].replace(/\/$/, '');
            const cleanPath = (pathname ?? '').replace(/\/$/, '');
            if (cleanHref === cleanPath) return;
            if (navigatingRef.current) return;

            // CRITICAL: stop propagation so Next.js <Link> doesn't navigate immediately
            e.preventDefault();
            e.stopPropagation();

            navigatingRef.current = true;
            pendingHref.current = href;
            setPhase('covering');
        };

        // Capture phase fires before React's event delegation
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [pathname, router]);

    const overlayOpaque = phase === 'covering' || phase === 'covered';

    return (
        <>
            {children}

            {/* Dark overlay curtain */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    backgroundColor: '#0E110F',
                    opacity: overlayOpaque ? 1 : 0,
                    transition: `opacity ${overlayOpaque ? '0.4s' : '0.55s'} cubic-bezier(0.22, 1, 0.36, 1)`,
                    pointerEvents: overlayOpaque ? 'all' : 'none',
                }}
            />
        </>
    );
}
