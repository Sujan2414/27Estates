"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, Users, Building2 } from "lucide-react";
import styles from "./Sidebar.module.css";

// Custom Home icon similar to reference
const PropertyIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { icon: PropertyIcon, label: "Home", path: "/properties" },
        { icon: Search, label: "Properties", path: "/properties/search" },
        { icon: Building2, label: "Projects", path: "/properties/projects" },
        { icon: Heart, label: "Bookmarks", path: "/properties/bookmarks" },
        { icon: Users, label: "Agents", path: "/properties/agents" },
    ];

    const isActive = (path: string) => {
        if (path === "/properties") {
            return pathname === "/properties";
        }
        return pathname === path;
    };

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
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <div key={item.path + item.label} className={styles.navItem}>
                            <Link
                                href={item.path}
                                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                            >
                                <Icon />
                            </Link>
                            <span className={styles.tooltip}>{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            {/* Account at bottom */}
            <div className={styles.backSection}>
                <div className={styles.backItem}>
                    <Link href="/" className={styles.backLink}>
                        <Users size={22} strokeWidth={1.5} />
                    </Link>
                    <span className={styles.tooltip}>Account</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
