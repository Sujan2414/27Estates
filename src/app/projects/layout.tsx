import React from 'react';
import Sidebar from '@/components/emergent/Sidebar';
import MobileNav from '@/components/emergent/MobileNav';
import styles from '@/components/emergent/Dashboard.module.css';

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.dashboardLayout} data-lenis-prevent>
            <Sidebar />
            <div className={styles.mainContent}>
                {children}
            </div>
            <MobileNav />
        </div>
    );
}
