'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { services } from '@/lib/services-data';
import styles from './Navigation.module.css';

interface NavigationProps {
    alwaysScrolled?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ alwaysScrolled = false }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/services', label: 'Services', target: undefined },
        { href: '/properties', label: 'Properties', target: undefined },
        { href: '/blog', label: 'Insights', target: undefined },
        { href: '/#calculator', label: 'Mortgage Calculator', target: undefined },
    ];

    return (
        <motion.nav
            className={`${styles.nav} ${isScrolled || alwaysScrolled ? styles.scrolled : ''}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logoLink}>
                    <Image
                        src="/Nav_Logo_HD_v3.png"
                        alt="27 Estates"
                        width={300}
                        height={90}
                        className={styles.logo}
                        priority
                    />
                </Link>

                {/* Desktop Links */}
                <div className={styles.navLinks}>

                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            target={link.target}
                            className={`${styles.navLink} flex items-center gap-1 group`}
                        >
                            {link.label}
                        </Link>
                    ))}
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
                {/* Services Mobile */}
                <div className="w-full text-center border-b border-gray-200 pb-2 mb-2">
                    <Link
                        href="/services"
                        className={styles.mobileLink}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Services
                    </Link>
                </div>

                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={styles.mobileLink}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {link.label}
                    </Link>
                ))}
                <Link href="tel:+919876543210" className={styles.mobilePhone}>
                    +91 98765 43210
                </Link>
            </motion.div>
        </motion.nav>
    );
};

export default Navigation;
