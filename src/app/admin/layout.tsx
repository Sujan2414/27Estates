'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Building2,
    FileText,
    MessageSquare,
    Users,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import styles from './admin.module.css'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [user, setUser] = useState<{ email: string; full_name: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = useMemo(() => createClient(), [])

    const isLoginPage = pathname === '/admin/login'

    useEffect(() => {
        // Skip auth check for login page
        if (isLoginPage) {
            setLoading(false)
            return
        }

        const checkUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                router.push('/admin/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email, role')
                .eq('id', authUser.id)
                .single()

            if (!profile || profile.role !== 'admin') {
                router.push('/admin/login')
                return
            }

            setUser({ email: profile.email || authUser.email || '', full_name: profile.full_name || 'Admin' })
            setLoading(false)
        }

        checkUser()
    }, [router, supabase, isLoginPage])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Properties', href: '/admin/properties', icon: Building2 },
        { name: 'Blog Posts', href: '/admin/blogs', icon: FileText },
        { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
        { name: 'Agents', href: '/admin/agents', icon: Users },
    ]

    // Skip layout for login page - AFTER hooks
    if (isLoginPage) {
        return <>{children}</>
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        )
    }

    return (
        <div className={styles.adminLayout}>
            {/* Mobile menu button */}
            <button
                className={styles.mobileMenuBtn}
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoIcon}>27</div>
                    <span className={styles.logoText}>Admin</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href))
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

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className={styles.userName}>{user?.full_name}</div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    )
}
