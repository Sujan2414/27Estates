'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Building2,
    FolderKanban,
    FileText,
    MessageSquare,
    Upload,
    Users,
    Contact,
    Briefcase,
    LogOut,
    Menu,
    X,
    Landmark,
    Warehouse,
    LayoutGrid,
    TrendingUp,
    Shield,
} from 'lucide-react'
import styles from './admin.module.css'
import ProfileModal from '@/components/ProfileModal'

interface AdminLayoutProps {
    children: React.ReactNode
}

interface AdminUser {
    id: string
    email: string
    full_name: string
    role: string
    avatar_url?: string | null
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [user,        setUser]        = useState<AdminUser | null>(null)
    const [loading,     setLoading]     = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const router   = useRouter()
    const pathname = usePathname()
    const supabase = useMemo(() => createClient(), [])

    const isLoginPage = pathname === '/admin/login'

    const checkUser = useCallback(async () => {
        if (isLoginPage) { setLoading(false); return }

        try {
            const res = await fetch('/api/admin/me')
            if (!res.ok) { router.push('/admin/login'); return }

            const { user: profile } = await res.json()
            if (!profile) { router.push('/admin/login'); return }

            setUser(profile)
        } catch {
            router.push('/admin/login')
        } finally {
            setLoading(false)
        }
    }, [isLoginPage, router])

    useEffect(() => {
        checkUser()
    }, [checkUser])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const allNavItems = [
        { name: 'Dashboard',         href: '/admin',             icon: LayoutDashboard, roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Properties',        href: '/admin/properties',  icon: Building2,       roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Projects',          href: '/admin/projects',    icon: FolderKanban,    roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Commercial',        href: '/admin/commercial',  icon: Landmark,        roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Warehouse',         href: '/admin/warehouse',   icon: Warehouse,       roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Blog Posts',        href: '/admin/blogs',       icon: FileText,        roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Careers',           href: '/admin/careers',     icon: Briefcase,       roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Inquiries',         href: '/admin/inquiries',   icon: MessageSquare,   roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Submissions',       href: '/admin/submissions', icon: Upload,          roles: ['admin', 'super_admin', 'agent', 'manager'] },
        { name: 'Agents',            href: '/admin/agents',      icon: Users,           roles: ['admin', 'super_admin'] },
        { name: 'Users',             href: '/admin/users',       icon: Users,           roles: ['admin', 'super_admin'] },
        { name: 'Owners/Developers', href: '/admin/owners',      icon: Contact,         roles: ['admin', 'super_admin', 'agent', 'manager'] },
    ]

    const userRole   = user?.role || 'agent'
    const navItems   = allNavItems.filter(item => item.roles.includes(userRole))

    if (isLoginPage) return <>{children}</>

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        )
    }

    const initials = user?.full_name?.charAt(0)?.toUpperCase() || 'U'

    return (
        <div className={styles.adminLayout}>
            {/* Mobile menu */}
            <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                {/* Brand */}
                <div className={styles.sidebarHeader}>
                    <div style={{ backgroundColor: '#183C38', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/27 Estates_Logo.png" alt="27 Estates" style={{ width: 60, height: 60, objectFit: 'contain', transform: 'scale(1.6)', transformOrigin: 'center' }} />
                    </div>
                    <div>
                        <div className={styles.logoText}>27 Estates</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>CMS</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className={styles.nav}>
                    {navItems.map(item => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname?.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className={styles.sidebarFooter}>
                    {/* Profile card — at top */}
                    <button
                        onClick={() => { setSidebarOpen(false); setShowProfile(true) }}
                        className={styles.adminProfileCard}
                    >
                        <div className={styles.userAvatar}>
                            {user?.avatar_url
                                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : initials
                            }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.userName}>{user?.full_name}</div>
                            <div className={styles.adminUserRole}>
                                {({ super_admin: 'CEO / Super Admin', admin: 'Admin', manager: 'Manager', agent: 'Agent' } as Record<string,string>)[user?.role || 'agent'] || user?.role}
                            </div>
                        </div>
                    </button>

                    {/* Portal switcher — 3 fixed buttons, CMS is current */}
                    <div className={styles.footerPortalBtns}>
                        <Link href="/crm" className={styles.footerBtn}>
                            <TrendingUp size={12} /> CRM
                        </Link>
                        <span className={`${styles.footerBtn} ${styles.footerBtnCurrent}`}>
                            <Shield size={12} /> CMS
                        </span>
                        <Link href="/hrms" className={styles.footerBtn}>
                            <LayoutGrid size={12} /> HRMS
                        </Link>
                    </div>

                    {/* Sign out */}
                    <button onClick={handleLogout} className={styles.footerSignOut}>
                        <LogOut size={13} /> Sign out
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

            {/* Main content */}
            <main className={styles.mainContent}>
                {children}
            </main>

            {/* Profile modal */}
            {showProfile && user && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfile(false)}
                    onUpdate={u => setUser(prev => prev ? { ...prev, ...u } : prev)}
                />
            )}
        </div>
    )
}
