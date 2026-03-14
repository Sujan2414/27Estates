"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Users, Building2, Building, LogOut, Landmark, Warehouse, Grid } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

// Custom Home icon similar to reference
const PropertyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

const Sidebar = () => {
    const pathname = usePathname();
    const { user, signOut, showAuthModal } = useAuth();

    const topNavItems = [
        { icon: PropertyIcon, label: "Home", path: "/properties" },
    ];

    const bottomNavItems = [
        { icon: Heart, label: "Bookmarks", path: "/properties/bookmarks", size: 24 },
        { icon: Users, label: "Agents", path: "/properties/agents", size: 24 },
    ];

    const isActive = (path: string) => {
        if (path === "/properties") {
            return pathname === "/properties";
        }
        if (path === "/properties/projects") {
            return pathname === "/properties/projects" || pathname?.startsWith("/projects/");
        }
        return pathname === path || pathname?.startsWith(path + "/");
    };

    // Protected paths that require login for guests
    const protectedPaths: string[] = [];

    return (
        <aside className={styles.sidebar} data-lenis-prevent>
            {/* Logo */}
            <div className={styles.logoSection}>
                <Link href="/" className={styles.logoLink} title="Back to Home">
                    <img src="/sidebar-logo.png" alt="27 Estates" className={styles.logoIcon} />
                </Link>
            </div>

            {/* Navigation */}
            <nav className={styles.nav}>
                {/* Home */}
                {topNavItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <div key={item.path + item.label} className={styles.navItem}>
                            <Link href={item.path} className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}>
                                <Icon />
                            </Link>
                            <span className={styles.tooltip}>{item.label}</span>
                        </div>
                    );
                })}

                {/* Browse — hover flyout (2nd position) */}
                <div className={styles.navItem}>
                    <div className={`${styles.navLink} ${styles.browseBtn}`}>
                        <Grid size={24} strokeWidth={1.5} />
                    </div>
                    <span className={styles.tooltip}>Browse</span>
                    <div className={styles.browseFlyout}>
                        <p className={styles.browseFlyoutTitle}>Browse</p>
                        <div className={styles.browseFlyoutGrid}>
                            {browseCategories.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <Link
                                        key={cat.label}
                                        href={cat.path}
                                        className={styles.browseFlyoutCard}
                                    >
                                        <div className={styles.browseFlyoutIcon}>
                                            <Icon size={20} />
                                        </div>
                                        <span className={styles.browseFlyoutLabel}>{cat.label}</span>
                                        <span className={styles.browseFlyoutDesc}>{cat.desc}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bookmarks & Agents */}
                {bottomNavItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    const isProtected = protectedPaths.includes(item.path) && !user;

                    if (isProtected) {
                        return (
                            <div key={item.path + item.label} className={styles.navItem}>
                                <button
                                    onClick={() => showAuthModal(item.path)}
                                    className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Icon size={item.size} />
                                </button>
                                <span className={styles.tooltip}>{item.label}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={item.path + item.label} className={styles.navItem}>
                            <Link href={item.path} className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}>
                                <Icon size={item.size} />
                            </Link>
                            <span className={styles.tooltip}>{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            {/* Auth action at bottom */}
            <div className={styles.backSection}>
                {user ? (
                    <div className={styles.backItem}>
                        <button
                            onClick={signOut}
                            className={styles.backLink}
                            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                            title="Sign Out"
                        >
                            <LogOut size={22} strokeWidth={1.5} />
                        </button>
                        <span className={styles.tooltip}>Sign Out</span>
                    </div>
                ) : null}
            </div>
        </aside>
    );
};

export default Sidebar;
