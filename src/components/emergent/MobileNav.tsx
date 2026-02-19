"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, Users, Building2, Building, Home as HomeIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./MobileNav.module.css";

// Custom Home icon
const PropertyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const MobileNav = () => {
    const pathname = usePathname();
    const { user, showAuthModal } = useAuth();

    const navItems = [
        { icon: PropertyIcon, label: "Home", path: "/properties" },
        { icon: Building2, label: "Projects", path: "/properties/projects" },
        { icon: Building, label: "Properties", path: "/properties/search" },
        { icon: Heart, label: "Bookmarks", path: "/properties/bookmarks" },
        { icon: Users, label: "Agents", path: "/properties/agents" },
    ];

    const isActive = (path: string) => {
        if (path === "/properties") return pathname === "/properties";
        if (path === "/properties/projects") {
            return pathname === "/properties/projects" || pathname?.startsWith("/projects/");
        }
        return pathname === path;
    };

    // Protected paths that require login for guests
    const protectedPaths: string[] = [];

    return (
        <nav className={styles.mobileNav}>
            <div className={styles.navContainer}>
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    const isProtected = protectedPaths.includes(item.path) && !user;

                    if (isProtected) {
                        return (
                            <button
                                key={item.path}
                                onClick={() => showAuthModal(item.path)}
                                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                                aria-label={item.label}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                            >
                                <Icon />
                                <span className={styles.navLabel}>{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                            aria-label={item.label}
                        >
                            <Icon />
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
