'use client'

import { useEffect, useState, useMemo, useRef, type ElementType } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, Plug, Mail,
    Settings, LogOut, Menu, X, BarChart3, Zap, Bell,
    CalendarCheck, TrendingUp, ChevronRight,
    Building2, Users2, ClipboardList, Clock, Calendar, Sliders,
    Sun, Moon, MousePointerClick, ListChecks, Flame, Trophy,
} from 'lucide-react'
import styles from './crm.module.css'
import { CRMContext, type CRMUser, type CRMRole, ThemeProvider, useTheme } from './crm-context'

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
    const [newLeadsCount, setNewLeadsCount] = useState(0)
    const [pendingRegCount, setPendingRegCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifs, setShowNotifs] = useState(false)
    const [openSections, setOpenSections] = useState<Set<string>>(
        new Set(['overview', 'sales', 'automation', 'hrm', 'system'])
    )
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
                    .select('full_name, role')
                    .eq('id', authUser.id)
                    .single()

                if (!profile || !['admin', 'super_admin', 'agent'].includes(profile.role)) {
                    router.push('/admin/login'); setLoading(false); return
                }

                setCrmUser({
                    id: authUser.id,
                    full_name: profile.full_name || 'User',
                    role: profile.role as CRMRole,
                })

                const { count } = await supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'new')
                setNewLeadsCount(count || 0)

                // Pending regularizations count (super_admin only)
                if (profile.role === 'super_admin') {
                    const { count: regCount } = await supabase
                        .from('hrm_regularizations')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'pending')
                    setPendingRegCount(regCount || 0)
                }
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
        const isSA = role === 'super_admin'
        const isAdm = role === 'super_admin' || role === 'admin'

        const groups: NavGroup[] = [
            {
                id: 'overview', label: 'Overview',
                items: [
                    { name: 'Dashboard', href: '/crm', icon: LayoutDashboard, exact: true },
                    ...(isAdm ? [
                        { name: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
                        { name: 'Reports', href: '/crm/reports', icon: TrendingUp },
                        { name: 'User Analytics', href: '/crm/user-analytics', icon: MousePointerClick },
                        { name: 'Listings', href: '/crm/listings', icon: ListChecks },
                        { name: 'Warm Audience', href: '/crm/warm-audience', icon: Flame },
                        { name: 'Performance', href: '/crm/performance', icon: Trophy },
                    ] : []),
                ],
            },
            {
                id: 'sales', label: 'Sales',
                items: [
                    { name: 'Leads', href: '/crm/leads', icon: Users, badge: newLeadsCount > 0 ? newLeadsCount : undefined },
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
            {
                id: 'hrm', label: 'HRM',
                items: [
                    { name: 'Overview', href: '/crm/hrm', icon: Building2, exact: true },
                    // Employees: admin+ only
                    ...(isAdm ? [{ name: 'Employees', href: '/crm/hrm/employees', icon: Users2 }] : []),
                    { name: 'Tasks', href: '/crm/hrm/tasks', icon: ClipboardList },
                    // Attendance admin view: admin+; agents can only see their own
                    ...(isAdm
                        ? [{ name: 'Attendance', href: '/crm/hrm/attendance', icon: Clock }]
                        : [{ name: 'My Attendance', href: '/crm/hrm/attendance', icon: Clock }]
                    ),
                    { name: 'Leaves', href: '/crm/hrm/leaves', icon: Calendar },
                    // Regularisations: visible to all, badge for super_admin
                    { name: 'Regularisations', href: '/crm/hrm/regularizations', icon: Clock, badge: isSA && pendingRegCount > 0 ? pendingRegCount : undefined },
                    // Leave Allocations: super_admin only
                    ...(isSA ? [{ name: 'Leave Allocations', href: '/crm/hrm/allocations', icon: Sliders }] : []),
                    // Work Settings: super_admin only
                    ...(isSA ? [{ name: 'Work Settings', href: '/crm/hrm/work-settings', icon: Settings }] : []),
                ],
            },
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
    }, [crmUser, newLeadsCount, pendingRegCount])

    const toggleSection = (id: string) => {
        setOpenSections(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

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
        admin: { label: 'Admin', color: 'var(--crm-btn-primary-bg)' },
        agent: { label: 'Agent', color: '#3b82f6' },
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
                        <div style={{ backgroundColor: '#183C38', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 46, height: 46 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/27 Estates_Logo.png" alt="27 Estates" style={{ width: 38, height: 38, objectFit: 'contain', objectPosition: 'top' }} />
                        </div>
                        <div>
                            <div className={styles.logoTitle}>27 Estates</div>
                            <div className={styles.logoSub}>CRM Platform</div>
                        </div>
                    </div>

                    <nav className={styles.nav} data-lenis-prevent>
                        {navGroups.map(group => {
                            const isOpen = openSections.has(group.id)
                            const hasActiveItem = group.items.some(item =>
                                item.exact ? pathname === item.href : pathname?.startsWith(item.href)
                            )
                            return (
                                <div key={group.id}>
                                    <button
                                        onClick={() => toggleSection(group.id)}
                                        className={styles.navSectionToggle}
                                    >
                                        <span
                                            className={styles.navSectionLabel}
                                            style={hasActiveItem && !isOpen ? { color: 'var(--crm-accent)' } : undefined}
                                        >
                                            {group.label}
                                        </span>
                                        <ChevronRight
                                            size={12}
                                            style={{
                                                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s',
                                                color: 'var(--crm-text-dim)',
                                            }}
                                        />
                                    </button>

                                    {isOpen && group.items.map(item => {
                                        const isActive = item.exact
                                            ? pathname === item.href
                                            : pathname?.startsWith(item.href)
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                                onClick={() => setSidebarOpen(false)}
                                                style={{ paddingLeft: '1.25rem' }}
                                            >
                                                {item.icon && <item.icon size={15} />}
                                                <span>{item.name}</span>
                                                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <Link href="/admin" className={styles.navItem} style={{ fontSize: '0.75rem', color: 'var(--crm-btn-primary-bg)', fontWeight: 600 }}>
                            ← Back to Admin
                        </Link>
                        <div style={{ padding: '0.625rem 0.75rem' }}>
                            {/* Role badge */}
                            {badge && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                                        letterSpacing: '0.06em', color: badge.color,
                                        backgroundColor: `${badge.color}15`, padding: '2px 8px', borderRadius: '999px',
                                    }}>
                                        {badge.label}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    backgroundColor: 'var(--crm-btn-primary-bg)', color: 'var(--crm-btn-primary-text)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 700,
                                }}>
                                    {crmUser?.full_name?.charAt(0) || 'U'}
                                </div>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-tertiary)', flex: 1 }}>{crmUser?.full_name}</span>
                                <button onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)', padding: '4px' }}>
                                    <LogOut size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

                {/* Main content */}
                <main className={styles.main} data-lenis-prevent>
                    {/* Top bar: theme toggle + notification bell */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1.5rem 0', position: 'relative', gap: '0.5rem', alignItems: 'center' }} ref={notifRef}>
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className={styles.themeToggle}
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        </button>

                        {/* Notification bell */}
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            style={{
                                position: 'relative', border: 'none', background: 'none', cursor: 'pointer',
                                color: unreadCount > 0 ? 'var(--crm-accent)' : 'var(--crm-text-dim)', padding: '6px',
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

                        {showNotifs && (
                            <div style={{
                                position: 'absolute', top: '100%', right: '1.5rem', zIndex: 100,
                                width: '340px', maxHeight: '480px', overflow: 'hidden',
                                backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border-subtle)',
                                borderRadius: '0.75rem', boxShadow: '0 20px 40px var(--crm-shadow)',
                                display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--crm-border)' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>Notifications</span>
                                    <button onClick={markAllRead} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-accent)', fontSize: '0.75rem' }}>
                                        Mark all read
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-dim)', fontSize: '0.875rem' }}>No notifications</div>
                                    ) : notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotifClick(n)}
                                            style={{
                                                padding: '0.75rem 1rem', cursor: 'pointer',
                                                borderBottom: '1px solid var(--crm-border)',
                                                backgroundColor: n.is_read ? 'transparent' : 'var(--crm-accent-bg)',
                                                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                            }}
                                        >
                                            <div style={{
                                                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                                                backgroundColor: n.is_read ? 'transparent' : (notifTypeColor[n.type] || '#6b7280'),
                                            }} />
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
                    </div>

                    {children}
                </main>
            </div>
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
