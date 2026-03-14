"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Users, Grid, X, Building2, Building, Landmark, Warehouse } from "lucide-react";
import styles from "./MobileNav.module.css";

// Custom Home icon
const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const browseCategories = [
    { icon: Building2, label: "Projects", path: "/properties/projects", desc: "New launches & upcoming" },
    { icon: Building, label: "Properties", path: "/properties/search", desc: "Apartments, villas & more" },
    { icon: Landmark, label: "Commercial", path: "/properties/commercial", desc: "Offices, retail & co-working" },
    { icon: Warehouse, label: "Warehouse", path: "/properties/warehouse", desc: "Storage & industrial spaces" },
];

const MobileNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [browseOpen, setBrowseOpen] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('browse-open', browseOpen);
        return () => document.body.classList.remove('browse-open');
    }, [browseOpen]);

    const isActive = (path: string) => {
        if (path === "/properties") return pathname === "/properties";
        return pathname === path || pathname?.startsWith(path + "/");
    };

    const handleBrowseNav = (path: string) => {
        setBrowseOpen(false);
        router.push(path);
    };

    return (
        <>
            {/* Bottom Sheet Overlay */}
            {browseOpen && (
                <div className={styles.browseOverlay} onClick={() => setBrowseOpen(false)}>
                    <div className={styles.browseSheet} onClick={e => e.stopPropagation()}>
                        <div className={styles.browseSheetHeader}>
                            <span className={styles.browseSheetTitle}>Browse</span>
                            <button className={styles.browseCloseBtn} onClick={() => setBrowseOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.browseGrid}>
                            {browseCategories.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.label}
                                        className={styles.browseCategoryCard}
                                        onClick={() => handleBrowseNav(cat.path)}
                                    >
                                        <div className={styles.browseCategoryIcon}>
                                            <Icon size={24} />
                                        </div>
                                        <span className={styles.browseCategoryLabel}>{cat.label}</span>
                                        <span className={styles.browseCategoryDesc}>{cat.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav className={styles.mobileNav}>
                <div className={styles.navContainer}>
                    {/* Home */}
                    <Link
                        href="/properties"
                        className={`${styles.navLink} ${isActive("/properties") ? styles.navLinkActive : ''}`}
                        aria-label="Home"
                    >
                        <HomeIcon />
                        <span className={styles.navLabel}>Home</span>
                    </Link>

                    {/* Browse — opens bottom sheet */}
                    <button
                        className={`${styles.navLink} ${browseOpen ? styles.navLinkActive : ''}`}
                        onClick={() => setBrowseOpen(true)}
                        aria-label="Browse"
                    >
                        <Grid size={20} />
                        <span className={styles.navLabel}>Browse</span>
                    </button>

                    {/* Bookmarks */}
                    <Link
                        href="/properties/bookmarks"
                        className={`${styles.navLink} ${isActive("/properties/bookmarks") ? styles.navLinkActive : ''}`}
                        aria-label="Bookmarks"
                    >
                        <Heart size={20} />
                        <span className={styles.navLabel}>Saved</span>
                    </Link>

                    {/* Agents */}
                    <Link
                        href="/properties/agents"
                        className={`${styles.navLink} ${isActive("/properties/agents") ? styles.navLinkActive : ''}`}
                        aria-label="Agents"
                    >
                        <Users size={20} />
                        <span className={styles.navLabel}>Agents</span>
                    </Link>
                </div>
            </nav>
        </>
    );
};

export default MobileNav;
