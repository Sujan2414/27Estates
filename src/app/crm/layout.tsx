'use client'

import { useEffect, useState, useMemo, useRef, type ElementType } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, Plug, Mail,
    Settings, LogOut, Menu, X, BarChart3, Zap, Bell,
    CalendarCheck, TrendingUp, Shield, LayoutGrid,
    Sun, Moon, MousePointerClick, ListChecks, Flame, Trophy,
} from 'lucide-react'
import styles from './crm.module.css'
import { CRMContext, type CRMUser, type CRMRole, ThemeProvider, useTheme } from './crm-context'
import ProfileModal from '@/components/ProfileModal'

interface Notification {
    id: string; type: string; title: string; body?: string; link?: string; is_read: boolean; created_at: string
}

interface NavItem {
    name: string; href: string; icon: ElementType; badge?: number; exact?: boolean
}

interface NavGroup {
    id: string; label: string; items: NavItem[]
}

function CRMLayoutInner({ children }: { children: React.ReactNode }) {
    const [crmUser, setCrmUser] = useState<CRMUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const [newLeadsCount, setNewLeadsCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifs, setShowNotifs] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = useMemo(() => createClient(), [])
    const { theme, toggleTheme } = useTheme()

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (!authUser) { router.push('/admin/login'); setLoading(false); return }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, reporting_manager_id, avatar_url')
                    .eq('id', authUser.id)
                    .single()

                if (!profile || !['admin', 'super_admin', 'agent', 'manager'].includes(profile.role)) {
                    router.push('/admin/login'); setLoading(false); return
                }

                setCrmUser({
                    id: authUser.id,
                    full_name: profile.full_name || 'User',
                    email: authUser.email,
                    role: profile.role as CRMRole,
                    reporting_manager_id: profile.reporting_manager_id || null,
                    avatar_url: profile.avatar_url || null,
                })

                const { count } = await supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'new')
                setNewLeadsCount(count || 0)


            } catch (err) {
                console.error('CRM init error:', err)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router, supabase])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/crm/notifications?limit=20')
            if (res.ok) { const d = await res.json(); setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) }
        } catch { /* silent */ }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
        }
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

    // ── Role-based nav ─────────────────────────────────────────
    const navGroups: NavGroup[] = useMemo(() => {
        const role = crmUser?.role
        const isSA  = role === 'super_admin'
        const isAdm = role === 'super_admin' || role === 'admin'
        const isMgr = role === 'super_admin' || role === 'admin' || role === 'manager'

        const groups: NavGroup[] = [
            {
                id: 'overview', label: 'Overview',
                items: [
                    { name: 'Dashboard', href: '/crm', icon: LayoutDashboard, exact: true },
                    ...(isMgr ? [
                        { name: 'Performance', href: '/crm/performance', icon: Trophy },
                    ] : []),
                    ...(isAdm ? [
                        { name: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
                        { name: 'Reports', href: '/crm/reports', icon: TrendingUp },
                        { name: 'User Analytics', href: '/crm/user-analytics', icon: MousePointerClick },
                        { name: 'Listings', href: '/crm/listings', icon: ListChecks },
                        { name: 'Warm Audience', href: '/crm/warm-audience', icon: Flame },
                    ] : []),
                ],
            },
            {
                id: 'sales', label: 'Sales',
                items: [
                    { name: 'Leads', href: '/crm/leads', icon: Users, badge: newLeadsCount > 0 ? newLeadsCount : undefined },
                    { name: 'Pipeline', href: '/crm/pipeline', icon: TrendingUp },
                    { name: 'Site Visits', href: '/crm/visits', icon: CalendarCheck },
                ],
            },
            // Automation: admin+ only
            ...(isAdm ? [{
                id: 'automation', label: 'Automation',
                items: [
                    { name: 'Connectors', href: '/crm/connectors', icon: Plug },
                    { name: 'Email', href: '/crm/emails', icon: Mail },
                    { name: 'Nurture', href: '/crm/nurture', icon: Zap },
                ],
            }] : []),
            // System: admin+ only
            ...(isAdm ? [{
                id: 'system', label: 'System',
                items: [
                    { name: 'API Usage', href: '/crm/usage', icon: Zap },
                    { name: 'Settings', href: '/crm/settings', icon: Settings },
                ],
            }] : []),
        ]

        return groups.filter(g => g.items.length > 0)
    }, [crmUser, newLeadsCount])

    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime()
        const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000)
        if (m < 1) return 'Just now'; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    const notifTypeColor: Record<string, string> = {
        new_lead: '#3b82f6', status_change: '#f59e0b', task_due: '#ef4444', note: '#6b7280',
    }

    // Role badge colours
    const roleBadge: Record<string, { label: string; color: string }> = {
        super_admin: { label: 'Super Admin', color: '#8b5cf6' },
        admin:       { label: 'Admin',       color: 'var(--crm-btn-primary-bg)' },
        manager:     { label: 'Manager',     color: '#f59e0b' },
        agent:       { label: 'Agent',       color: '#3b82f6' },
    }
    const badge = roleBadge[crmUser?.role || '']

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--crm-bg)' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--crm-border)', borderTopColor: 'var(--crm-accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <CRMContext.Provider value={crmUser}>
            <div className={styles.crmLayout} data-lenis-prevent data-theme={theme}>
                <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} data-lenis-prevent>
                    <div className={styles.sidebarHeader}>
                        <div style={{ backgroundColor: '#183C38', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 56, height: 56, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/27 Estates_Logo.png" alt="27 Estates" style={{ width: 64, height: 64, objectFit: 'contain', transform: 'scale(1.6)', transformOrigin: 'center' }} />
                        </div>
                        <div>
                            <div className={styles.logoTitle}>27 Estates</div>
                            <div className={styles.logoSub}>CRM Platform</div>
                        </div>
                    </div>

                    <nav className={styles.nav} data-lenis-prevent>
                        {navGroups.map(group => (
                            <div key={group.id} className={styles.navGroup}>
                                <div className={styles.navSection}>{group.label}</div>
                                {group.items.map(item => {
                                    const isActive = item.exact
                                        ? pathname === item.href
                                        : pathname?.startsWith(item.href)
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            {item.icon && <item.icon size={15} />}
                                            <span>{item.name}</span>
                                            {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                                        </Link>
                                    )
                                })}
                            </div>
                        ))}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        {/* Profile card — above portal buttons */}
                        <button
                            onClick={() => { setSidebarOpen(false); setShowProfile(true) }}
                            className={styles.profileBtn}
                        >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--crm-btn-primary-bg)', color: 'var(--crm-btn-primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                                {crmUser?.avatar_url
                                    ? <img src={crmUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : crmUser?.full_name?.charAt(0) || 'U'
                                }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--crm-text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crmUser?.full_name}</div>
                                {badge && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: badge.color }}>{badge.label}</span>}
                            </div>
                        </button>

                        {/* Portal switcher — 3 fixed buttons, CRM is current */}
                        <div className={styles.footerPortalBtns}>
                            <span className={`${styles.footerBtn} ${styles.footerBtnCurrent}`}>
                                <TrendingUp size={13} /> CRM
                            </span>
                            <Link href="/admin" className={styles.footerBtn}>
                                <Shield size={13} /> CMS
                            </Link>
                            <Link href="/hrms" className={styles.footerBtn}>
                                <LayoutGrid size={13} /> HRMS
                            </Link>
                        </div>

                        {/* Sign out */}
                        <button onClick={handleLogout} className={`${styles.footerBtn} ${styles.footerBtnFull}`}>
                            <LogOut size={13} /> Sign out
                        </button>
                    </div>
                </aside>

                {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

                {/* Main content */}
                <main className={styles.main} data-lenis-prevent>
                    {/* Top bar */}
                    <header className={styles.topBar} ref={notifRef}>
                        <button className={styles.mobileSidebarBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu size={20} />
                        </button>
                        <span style={{ flex: 1 }} />
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={toggleTheme} className={styles.themeToggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                            </button>
                            <button onClick={() => setShowNotifs(!showNotifs)} className={styles.topBarIconBtn}>
                                <Bell size={18} />
                                {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>
                        </div>
                        {showNotifs && (
                            <div style={{
                                position: 'absolute', top: '100%', right: '0.75rem', zIndex: 100,
                                width: '340px', maxHeight: '480px', overflow: 'hidden',
                                backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border-subtle)',
                                borderRadius: '0.75rem', boxShadow: '0 20px 40px var(--crm-shadow)',
                                display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--crm-border)' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>Notifications</span>
                                    <button onClick={markAllRead} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-accent)', fontSize: '0.75rem' }}>Mark all read</button>
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-dim)', fontSize: '0.875rem' }}>No notifications</div>
                                    ) : notifications.map(n => (
                                        <div key={n.id} onClick={() => handleNotifClick(n)} style={{
                                            padding: '0.75rem 1rem', cursor: 'pointer',
                                            borderBottom: '1px solid var(--crm-border)',
                                            backgroundColor: n.is_read ? 'transparent' : 'var(--crm-accent-bg)',
                                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px', backgroundColor: n.is_read ? 'transparent' : (notifTypeColor[n.type] || '#6b7280') }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: n.is_read ? 400 : 600, color: 'var(--crm-text-secondary)', marginBottom: '2px' }}>{n.title}</div>
                                                {n.body && <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>}
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>{formatRelative(n.created_at)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </header>

                    {children}
                </main>
            </div>
            {showProfile && crmUser && (
                <ProfileModal
                    user={{ ...crmUser, email: crmUser.email || '' }}
                    onClose={() => setShowProfile(false)}
                    onUpdate={u => setCrmUser(prev => prev ? { ...prev, ...u } : prev)}
                />
            )}
        </CRMContext.Provider>
    )
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CRMLayoutInner>{children}</CRMLayoutInner>
        </ThemeProvider>
    )
}
