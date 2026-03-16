'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, Kanban, Plug, Mail,
    Settings, LogOut, Menu, X, BarChart3, Zap, Bell,
    CalendarCheck, TrendingUp
} from 'lucide-react'
import styles from './crm.module.css'

interface Notification {
    id: string; type: string; title: string; body?: string; link?: string; is_read: boolean; created_at: string
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ full_name: string; role?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [newLeadsCount, setNewLeadsCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifs, setShowNotifs] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)
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

            const { count } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'new')
            setNewLeadsCount(count || 0)

            setLoading(false)
        }
        init()
    }, [router, supabase])

    // Poll notifications every 30s
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/crm/notifications?limit=20')
            if (res.ok) { const d = await res.json(); setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) }
        } catch {}
    }
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    // Close notifs on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const markAllRead = async () => {
        await fetch('/api/crm/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) })
        fetchNotifications()
    }

    const handleNotifClick = async (n: Notification) => {
        if (!n.is_read) {
            await fetch('/api/crm/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
        }
        setShowNotifs(false)
        if (n.link) router.push(n.link)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const navItems = [
        { section: 'Overview' },
        { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
        { name: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
        { name: 'Reports', href: '/crm/reports', icon: TrendingUp },
        { section: 'Leads' },
        { name: 'All Leads', href: '/crm/leads', icon: Users, badge: newLeadsCount > 0 ? newLeadsCount : undefined },
        { name: 'Pipeline', href: '/crm/pipeline', icon: Kanban },
        { name: 'Site Visits', href: '/crm/visits', icon: CalendarCheck },
        { section: 'Automation' },
        { name: 'Connectors', href: '/crm/connectors', icon: Plug },
        { name: 'Email', href: '/crm/emails', icon: Mail },
        { section: 'System' },
        { name: 'API Usage', href: '/crm/usage', icon: Zap },
        { name: 'Settings', href: '/crm/settings', icon: Settings },
    ]

    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime(); const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000)
        if (m < 1) return 'Just now'; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    const notifTypeColor: Record<string, string> = {
        new_lead: '#3b82f6', status_change: '#f59e0b', task_due: '#ef4444', note: '#6b7280',
    }

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
                {/* Top bar with notification bell */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1.5rem 0', position: 'relative' }} ref={notifRef}>
                    <button
                        onClick={() => setShowNotifs(!showNotifs)}
                        style={{
                            position: 'relative', border: 'none', background: 'none', cursor: 'pointer',
                            color: unreadCount > 0 ? '#BFA270' : '#4b5563', padding: '6px',
                        }}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '0', right: '0',
                                width: '18px', height: '18px', borderRadius: '50%',
                                backgroundColor: '#ef4444', color: '#fff',
                                fontSize: '0.625rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifs && (
                        <div style={{
                            position: 'absolute', top: '100%', right: '1.5rem', zIndex: 100,
                            width: '340px', maxHeight: '480px', overflow: 'hidden',
                            backgroundColor: '#161822', border: '1px solid #2d3148',
                            borderRadius: '0.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #1e2030' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>Notifications</span>
                                <button onClick={markAllRead} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#BFA270', fontSize: '0.75rem' }}>
                                    Mark all read
                                </button>
                            </div>
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.875rem' }}>No notifications</div>
                                ) : notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotifClick(n)}
                                        style={{
                                            padding: '0.75rem 1rem', cursor: 'pointer',
                                            borderBottom: '1px solid #1e2030',
                                            backgroundColor: n.is_read ? 'transparent' : '#BFA27008',
                                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                        }}
                                    >
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                                            backgroundColor: n.is_read ? 'transparent' : (notifTypeColor[n.type] || '#6b7280'),
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: n.is_read ? 400 : 600, color: '#e5e7eb', marginBottom: '2px' }}>{n.title}</div>
                                            {n.body && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>}
                                            <div style={{ fontSize: '0.6875rem', color: '#4b5563' }}>{formatRelative(n.created_at)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {children}
            </main>
        </div>
    )
}
