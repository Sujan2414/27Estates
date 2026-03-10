'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, Kanban, Plug, Mail,
    Settings, LogOut, Menu, X, BarChart3, Zap, Bell
} from 'lucide-react'
import styles from './crm.module.css'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ full_name: string; role?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [newLeadsCount, setNewLeadsCount] = useState(0)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const init = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) { router.push('/admin/login'); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', authUser.id)
                .single()

            if (!profile || !['admin', 'super_admin', 'agent'].includes(profile.role)) {
                router.push('/admin/login'); return
            }

            setUser({ full_name: profile.full_name || 'User', role: profile.role })

            // Get new leads count
            const { count } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'new')
            setNewLeadsCount(count || 0)

            setLoading(false)
        }
        init()
    }, [router, supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const navItems = [
        { section: 'Overview' },
        { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
        { name: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
        { section: 'Leads' },
        { name: 'All Leads', href: '/crm/leads', icon: Users, badge: newLeadsCount > 0 ? newLeadsCount : undefined },
        { name: 'Pipeline', href: '/crm/pipeline', icon: Kanban },
        { section: 'Automation' },
        { name: 'Connectors', href: '/crm/connectors', icon: Plug },
        { name: 'Email', href: '/crm/emails', icon: Mail },
        { section: 'System' },
        { name: 'API Usage', href: '/crm/usage', icon: Zap },
        { name: 'Settings', href: '/crm/settings', icon: Settings },
    ]

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1117' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #1e2030', borderTopColor: '#BFA270', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div className={styles.crmLayout} data-lenis-prevent>
            {/* Mobile menu */}
            <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} data-lenis-prevent>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoMark}>27</div>
                    <div>
                        <div className={styles.logoTitle}>27 Estates</div>
                        <div className={styles.logoSub}>CRM Platform</div>
                    </div>
                </div>

                <nav className={styles.nav} data-lenis-prevent>
                    {navItems.map((item, i) => {
                        if ('section' in item && item.section) {
                            return <div key={i} className={styles.navSection}>{item.section}</div>
                        }
                        const isActive = item.href === '/crm'
                            ? pathname === '/crm'
                            : pathname?.startsWith(item.href!)
                        return (
                            <Link
                                key={item.name}
                                href={item.href!}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                {item.icon && <item.icon size={16} />}
                                <span>{item.name}</span>
                                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <Link href="/admin" className={styles.navItem} style={{ fontSize: '0.75rem' }}>
                        ← Back to Admin
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: '#BFA270', color: '#0f1117',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700,
                        }}>
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: '#d1d5db', flex: 1 }}>{user?.full_name}</span>
                        <button onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className={styles.main} data-lenis-prevent>
                {children}
            </main>
        </div>
    )
}
