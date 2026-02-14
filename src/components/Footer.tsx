'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>


                {/* Links Grid */}
                <div className={styles.linksGrid}>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Navigation</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="#about">About</Link></li>
                            <li><a href="/properties">Properties</a></li>
                            <li><Link href="#contact">Contact</Link></li>
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Properties</h4>
                        <ul className={styles.linkList}>
                            <li><a href="/properties">Apartments</a></li>
                            <li><a href="/properties">Villas</a></li>
                            <li><a href="/properties">Plots</a></li>
                            <li><Link href="#calculator">EMI Calculator</Link></li>
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Contact</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="tel:+919844653113">+91 98446 53113</Link></li>
                            <li><Link href="mailto:connect@27estates.com">connect@27estates.com</Link></li>
                            <li>83, Prestige Copper Arch, Infantry Road, Bangalore, Karnataka 560001</li>
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Connect</h4>
                        <div className={styles.socialLinks}>
                            <a href="https://www.instagram.com/27estates/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a href="https://in.linkedin.com/company/27-estates" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                                    <rect x="2" y="9" width="4" height="12" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                            <a href="https://www.facebook.com/27estates/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        {currentYear} © 27 Estates. All rights reserved.
                    </p>
                    <p className={styles.tagline}>
                        Own the Extraordinary
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
