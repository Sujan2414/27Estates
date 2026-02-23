'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const { checkAuthAndNavigate } = useAuth();

    const handlePropertyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        checkAuthAndNavigate('/properties');
    };

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
                            <li><Link href="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Discover</h4>
                        <ul className={styles.linkList}>
                            <li>
                                <button
                                    onClick={handlePropertyClick}
                                    className={styles.footerLinkBtn}
                                    type="button"
                                >
                                    Properties
                                </button>
                            </li>
                            <li><Link href="/blog">Insights</Link></li>
                            <li><Link href="#calculator">EMI Calculator</Link></li>
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Contact</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="tel:+918095799929">+91 80957 99929</Link></li>
                            <li><Link href="mailto:connect@27estates.com">connect@27estates.com</Link></li>
                            <li>83, Prestige Copper Arch, Infantry Road, Bangalore, Karnataka 560001</li>
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Connect</h4>
                        <div className={styles.socialLinks}>
                            <a href="https://wa.me/918095799929" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="WhatsApp">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.06A8.1 8.1 0 0110.82 12.4a8.9 8.9 0 01-1.332-1.661c-.173-.298-.018-.461.13-.611.134-.133.301-.35.451-.525.146-.176.195-.301.295-.498.1-.2.05-.376-.025-.525-.075-.15-.672-1.62-.922-2.218-.242-.58-.487-.5-.672-.51l-.574-.01c-.198 0-.52.074-.792.372C7.03 6.541 6.208 7.314 6.208 8.887c0 1.572 1.026 3.09 1.169 3.284.145.196 2.235 3.414 5.42 4.717.757.309 1.348.494 1.808.632.763.228 1.458.196 2.008.119.617-.087 1.896-.776 2.164-1.523.268-.748.268-1.39.188-1.524-.076-.134-.275-.21-.575-.36zm-5.464 6.136H12a9.46 9.46 0 01-4.814-1.306l-.345-.205-3.578.938.955-3.486-.225-.357A9.45 9.45 0 012.54 12c0-5.232 4.266-9.489 9.504-9.489 2.535 0 4.915.986 6.703 2.775A9.43 9.43 0 0121.503 12c0 5.235-4.261 9.49-9.47 9.518z" />
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/27estates/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/company/27estates/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
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
        </footer>);
};

export default Footer;
