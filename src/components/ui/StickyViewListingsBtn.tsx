'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-1';
import { useAuth } from '@/context/AuthContext';

const StickyViewListingsBtn: React.FC = () => {
    const [isInHero, setIsInHero] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const container = document.getElementById('page-scroll-container');
            // Get viewport height to determine if hero is visible
            const scrollPosition = container ? container.scrollTop : window.scrollY;
            const viewportHeight = window.innerHeight;

            // Consider hero visible if we're in the first viewport height
            setIsInHero(scrollPosition < viewportHeight * 0.8);
        };

        // Try to attach to the specific scroll container first
        const container = document.getElementById('page-scroll-container');
        const target = container || window;

        // Initial check
        handleScroll();

        // Add scroll listener
        target.addEventListener('scroll', handleScroll, { passive: true });

        if (container) {
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            target.removeEventListener('scroll', handleScroll);
            if (container) {
                window.removeEventListener('resize', handleScroll);
            }
        };
    }, []);

    const { checkAuthAndNavigate } = useAuth();
    // Don't show on properties, projects, or admin pages
    const isPropertiesPage = pathname?.startsWith('/properties');
    const isProjectsPage = pathname?.startsWith('/projects');
    const isAdminPage = pathname?.startsWith('/admin');
    const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/login') || pathname?.startsWith('/signup');

    if (isPropertiesPage || isProjectsPage || isAdminPage || isAuthPage) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: isInHero ? 0 : 1,
                    scale: isInHero ? 0.8 : 1,
                    pointerEvents: isInHero ? 'none' : 'auto'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => checkAuthAndNavigate('/properties')}
            >
                <Button
                    variant="mono"
                    size="lg"
                    className="shadow-xl min-w-[180px] transition-colors duration-300 !bg-[#183C38] hover:!bg-[#163E38] !text-white"
                >
                    View Listings
                </Button>
            </motion.div>
        </div>
    );
};

export default StickyViewListingsBtn;
