"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, Users } from "lucide-react";
import styles from "./MobileNav.module.css";

// Custom Home icon similar to reference
const PropertyIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const MobileNav = () => {
    const pathname = usePathname();

    const navItems = [
        { icon: PropertyIcon, label: "Properties", path: "/properties" },
        { icon: Search, label: "Search", path: "/properties/search" },
        { icon: Users, label: "Agents", path: "/properties/agents" },
        { icon: Heart, label: "Bookmarks", path: "/properties/bookmarks" },
    ];

    const isActive = (path: string) => {
        if (path === "/properties") {
            return pathname === "/properties";
        }
        return pathname === path;
    };

    return (
        <nav className={styles.mobileNav}>
            <div className={styles.navContainer}>
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                            aria-label={item.label}
                        >
                            <Icon />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
