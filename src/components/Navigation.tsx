'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { services } from '@/lib/services-data';
import { useAuth } from '@/context/AuthContext';
import styles from './Navigation.module.css';

interface NavigationProps {
    alwaysScrolled?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ alwaysScrolled = false }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = React.useRef(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const { showAuthModal, isLoggedIn } = useAuth();

    const pathname = usePathname(); // Need this to check for home page

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Threshold: Full screen height for home page (Hero), 50px for others
            const scrollThreshold = pathname === '/' ? (viewportHeight - 100) : 50;

            // Determine if scrolled styling should apply
            setIsScrolled(currentScrollY > scrollThreshold);

            // Only toggle visibility after a meaningful scroll delta (prevents stuttering)
            const delta = currentScrollY - lastScrollY.current;

            if (delta > 8 && currentScrollY > 100) {
                // Scrolling DOWN past threshold
                setIsVisible(false);
                setIsMobileMenuOpen(false);
            } else if (delta < -8) {
                // Scrolling UP past threshold
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [pathname]);

    // Links that require auth modal
    const protectedPaths: string[] = ['/properties', '/properties/search'];

    const navLinks = [
        { href: '/services', label: 'Services', target: undefined },
        { href: '/properties', label: 'Properties', target: undefined },
        { href: '/blog', label: 'Insights', target: undefined },
        { href: '/mortgage-calculator', label: 'Mortgage Calculator', target: undefined },
    ];

    const handleNavClick = (e: React.MouseEvent, href: string) => {
        if (protectedPaths.includes(href)) {
            e.preventDefault();
            showAuthModal(href);
        }
    };

    return (
        <motion.nav
            className={`${styles.nav} ${isScrolled || alwaysScrolled ? styles.scrolled : ''} ${isMobileMenuOpen ? styles.menuOpen : ''}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{
                y: isVisible ? 0 : '-100%',
                opacity: isVisible ? 1 : 0,
            }}
            transition={hasEntered
                ? { duration: 0.3, ease: 'easeInOut' }
                : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
            }
            onAnimationComplete={() => {
                if (!hasEntered) setHasEntered(true);
            }}
        >
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logoLink}>
                    <Image
                        src="/logo-trimmed.png"
                        alt="27 Estates"
                        width={300}
                        height={90}
                        className={styles.logo}
                        priority
                    />
                </Link>

                {/* Desktop Links */}
                <div className={styles.navLinks}>
                    {navLinks.map((link) => {
                        const isProtected = protectedPaths.includes(link.href) && !isLoggedIn;

                        if (isProtected) {
                            return (
                                <button
                                    key={link.href}
                                    className={`${styles.navLink} flex items-center gap-1 group bg-transparent border-none cursor-pointer`}
                                    onClick={() => showAuthModal(link.href)}
                                >
                                    {link.label}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                target={link.target}
                                className={`${styles.navLink} flex items-center gap-1 group`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Contact Button */}
                <div className={styles.rightSection}>
                    <Link href="/contact" className={styles.contactBtn}>
                        Contact us
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className={styles.menuToggle}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`${styles.menuBar} ${isMobileMenuOpen ? styles.open : ''}`} />
                </button>
            </div>

            {/* Mobile Menu */}
            <motion.div
                className={styles.mobileMenu}
                initial={false}
                animate={{
                    height: isMobileMenuOpen ? 'auto' : 0,
                    opacity: isMobileMenuOpen ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {navLinks.map((link) => {
                    const isProtected = protectedPaths.includes(link.href) && !isLoggedIn;

                    if (isProtected) {
                        return (
                            <button
                                key={link.href}
                                className={`${styles.mobileLink} w-full text-center bg-transparent border-none cursor-pointer`}
                                onClick={() => {
                                    showAuthModal(link.href);
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                {link.label}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.mobileLink}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    );
                })}
                <Link
                    href="/contact"
                    className={styles.mobilePhone}
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Contact Us
                </Link>
            </motion.div>
        </motion.nav>
    );
};

export default Navigation;

