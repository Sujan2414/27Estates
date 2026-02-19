'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHome = pathname === '/';

    // Scroll to top on navigation — use Lenis when available, fallback to native
    useEffect(() => {
        const lenis = (window as any).lenis;
        if (lenis) {
            lenis.scrollTo(0, { immediate: true });
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    // Home has its own preload animation — skip
    if (isHome) return <>{children}</>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}
