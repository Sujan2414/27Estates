'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-1';
import { useAuth } from '@/context/AuthContext';

const StickyViewListingsBtn: React.FC = () => {
    const [isInHero, setIsInHero] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const container = document.getElementById('page-scroll-container');
            const scrollPosition = container ? container.scrollTop : window.scrollY;
            const viewportHeight = window.innerHeight;

            setIsInHero(scrollPosition < viewportHeight * 0.8);
        };

        const container = document.getElementById('page-scroll-container');
        const target = container || window;

        handleScroll();

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
    const isPropertiesPage = pathname?.startsWith('/properties');
    const isProjectsPage = pathname?.startsWith('/projects');
    const isAdminPage = pathname?.startsWith('/admin');
    const isCrmPage = pathname?.startsWith('/crm');
    const isHrmsPage = pathname?.startsWith('/hrms');
    const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/login') || pathname?.startsWith('/signup');

    if (isPropertiesPage || isProjectsPage || isAdminPage || isCrmPage || isHrmsPage || isAuthPage) return null;

    return (
        <div className="fixed top-6 right-6 z-50">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{
                    opacity: isInHero ? 0 : 1,
                    y: isInHero ? -20 : 0,
                    pointerEvents: isInHero ? 'none' : 'auto'
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
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
