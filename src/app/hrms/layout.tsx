'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard, Clock, Calendar, CheckSquare, Users,
    Settings, LogOut, Sun, Moon, Menu, X, ChevronRight,
    Sliders, Building2, Shield, TrendingUp, LayoutGrid,
} from 'lucide-react'
import styles from './hrms.module.css'
import ProfileModal from '@/components/ProfileModal'

export type HRMSRole = 'super_admin' | 'admin' | 'manager' | 'agent'

export interface HRMSUser {
    id: string
    full_name: string
    email: string
    role: HRMSRole
    avatar_url?: string | null
    reporting_manager_id?: string | null
}

const ROLE_COLORS: Record<HRMSRole, { bg: string; color: string }> = {
    super_admin: { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed' },
    admin:       { bg: 'rgba(24,60,56,0.12)',   color: '#183C38' },
    manager:     { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
    agent:       { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
}
const ROLE_LABELS: Record<HRMSRole, string> = {
    super_admin: 'CEO / Super Admin',
    admin:       'Admin',
    manager:     'Manager',
    agent:       'Employee',
}

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    badge?: number
    exact?: boolean
}

function buildNav(role: HRMSRole, pendingLeaves: number): { section: string; items: NavItem[] }[] {
    const isSA  = role === 'super_admin'
    const isAdm = role === 'super_admin' || role === 'admin'
    const isMgr = role === 'super_admin' || role === 'admin' || role === 'manager'

    return [
        {
            section: 'My Space',
            items: [
                { label: 'My Day',        href: '/hrms',            icon: LayoutDashboard, exact: true },
                ...(!isSA ? [
                    { label: 'My Attendance', href: '/hrms/attendance', icon: Clock },
                    { label: 'My Leaves',     href: '/hrms/leaves',     icon: Calendar },
                ] : []),
                { label: 'My Tasks',      href: '/hrms/tasks',      icon: CheckSquare },
            ],
        },
        ...(isMgr ? [{
            section: 'Team',
            items: [
                { label: 'Team Overview',    href: '/hrms/team',              icon: Users },
                { label: 'Team Attendance',  href: '/hrms/team/attendance',   icon: Clock },
                { label: 'Leave Approvals',  href: '/hrms/team/leaves',       icon: Calendar, badge: pendingLeaves || undefined },
                { label: 'Regularisations',  href: '/hrms/team/regularizations', icon: Building2 },
            ],
        }] : []),
        ...(isAdm ? [{
            section: 'Admin',
            items: [
                { label: 'All Employees',    href: '/hrms/employees',      icon: Users },
                ...(isSA ? [
                    { label: 'Leave Allocations', href: '/hrms/allocations', icon: Sliders },
                    { label: 'Work Settings',     href: '/hrms/settings',    icon: Settings },
                ] : []),
            ],
        }] : []),
    ]
}

export default function HRMSLayout({ children }: { children: React.ReactNode }) {
    const router   = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const [user, setUser]             = useState<HRMSUser | null>(null)
    const [loading, setLoading]       = useState(true)
    const [theme, setTheme]           = useState<'light' | 'dark'>('light')
    const [sidebarOpen, setSidebar]   = useState(false)
    const [pendingLeaves, setPending] = useState(0)
    const [showProfile, setShowProfile] = useState(false)

    useEffect(() => {
        try {
            const t = localStorage.getItem('hrms-theme')
            if (t === 'dark' || t === 'light') setTheme(t)
        } catch { /* SSR */ }
    }, [])

    const toggleTheme = () => {
        setTheme(p => {
            const n = p === 'dark' ? 'light' : 'dark'
            try { localStorage.setItem('hrms-theme', n) } catch { /* */ }
            return n
        })
    }

    const init = useCallback(async () => {
        try {
            const { data: { user: auth } } = await supabase.auth.getUser()
            if (!auth) { router.push('/admin/login?redirect=/hrms'); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, reporting_manager_id, avatar_url')
                .eq('id', auth.id)
                .single()

            const allowed = ['super_admin', 'admin', 'manager', 'agent']
            if (!profile || !allowed.includes(profile.role)) {
                router.push('/admin/login'); return
            }

            const u: HRMSUser = {
                id: auth.id,
                full_name: profile.full_name || 'User',
                email: auth.email || '',
                role: profile.role as HRMSRole,
                reporting_manager_id: profile.reporting_manager_id,
                avatar_url: profile.avatar_url,
            }
            setUser(u)

            // Fetch pending leave count for manager+
            const isMgr = ['super_admin', 'admin', 'manager'].includes(profile.role)
            if (isMgr) {
                const params = new URLSearchParams({ status: 'pending', team_only: 'true', approver_id: auth.id })
                const res = await fetch(`/api/crm/hrm/leaves?${params}`)
                if (res.ok) {
                    const d = await res.json()
                    setPending((d.leaves || []).length)
                }
            }
        } catch (e) {
            console.error('HRMS init', e)
        } finally {
            setLoading(false)
        }
    }, [router, supabase])

    useEffect(() => { init() }, [init])

    // Sync profile changes from other sections (CMS, CRM)
    useEffect(() => {
        const handleProfileUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail as { full_name: string; avatar_url?: string | null }
            if (detail) setUser(prev => prev ? { ...prev, ...detail } : prev)
        }
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'profile-sync' && e.newValue) {
                try {
                    const { full_name, avatar_url } = JSON.parse(e.newValue)
                    setUser(prev => prev ? { ...prev, full_name, avatar_url } : prev)
                } catch { /* ignore */ }
            }
        }
        window.addEventListener('profile-updated', handleProfileUpdate)
        window.addEventListener('storage', handleStorage)
        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate)
            window.removeEventListener('storage', handleStorage)
        }
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href
        return pathname === href || pathname?.startsWith(href + '/')
    }

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const pageTitles: Record<string, string> = {
        '/hrms':                        'My Day',
        '/hrms/attendance':             'My Attendance',
        '/hrms/leaves':                 'My Leaves',
        '/hrms/tasks':                  'My Tasks',
        '/hrms/team':                   'Team Overview',
        '/hrms/team/attendance':        'Team Attendance',
        '/hrms/team/leaves':            'Leave Approvals',
        '/hrms/team/regularizations':   'Regularisations',
        '/hrms/employees':              'All Employees',
        '/hrms/allocations':            'Leave Allocations',
        '/hrms/settings':               'Work Settings',
    }
    const pageTitle = pageTitles[pathname] || 'HRMS'

    if (loading) {
        return (
            <div className={`${styles.root} ${styles.loader}`} data-theme={theme}>
                <div className={styles.spinner} />
                <span>Loading your workspace…</span>
            </div>
        )
    }

    if (!user) return null

    const roleColors = ROLE_COLORS[user.role]
    const navGroups  = buildNav(user.role, pendingLeaves)

    return (
        <>
        <div className={styles.root} data-theme={theme}>
            <div className={styles.shell}>

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div className={styles.overlay} onClick={() => setSidebar(false)} />
                )}

                {/* ── Sidebar ── */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>

                    {/* Brand */}
                    <Link href="/" className={styles.sidebarBrand} onClick={() => setSidebar(false)}>
                        <div className={styles.brandLogo}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/27 Estates_Logo.png" alt="27 Estates" style={{ width: 60, height: 60, objectFit: 'contain', transform: 'scale(1.6)', transformOrigin: 'center' }} />
                        </div>
                        <div className={styles.brandText}>
                            <div className={styles.brandTitle}>27 Estates</div>
                            <div className={styles.brandSub}>HR Portal</div>
                        </div>
                    </Link>

                    {/* Nav */}
                    <nav className={styles.sidebarNav}>
                        {navGroups.map(g => (
                            <div key={g.section} className={styles.navSection}>
                                <div className={styles.navSectionLabel}>{g.section}</div>
                                {g.items.map(item => {
                                    const Icon   = item.icon
                                    const active = isActive(item.href, item.exact)
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                                            onClick={() => setSidebar(false)}
                                        >
                                            <Icon size={16} className={styles.navItemIcon} />
                                            {item.label}
                                            {item.badge ? (
                                                <span className={styles.navBadge}>{item.badge}</span>
                                            ) : active ? (
                                                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                            ) : null}
                                        </Link>
                                    )
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className={styles.sidebarFooter}>
                        {/* Profile card */}
                        <button
                            className={`${styles.userCard} ${styles.userCardBtn}`}
                            onClick={() => { setSidebar(false); setShowProfile(true) }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className={styles.userAvatar}>
                                    {user.avatar_url
                                        ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                        : user.full_name.charAt(0).toUpperCase()
                                    }
                                </div>
                                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                                    <div className={styles.userName}>{user.full_name}</div>
                                    <div className={styles.userRole} style={{ background: roleColors.bg, color: roleColors.color }}>
                                        {ROLE_LABELS[user.role]}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Portal switcher — 3 fixed buttons, HRMS is current */}
                        <div className={styles.footerPortalBtns}>
                            <Link href="/crm" className={styles.footerBtn}>
                                <TrendingUp size={13} /> CRM
                            </Link>
                            <Link href="/admin" className={styles.footerBtn}>
                                <Shield size={13} /> CMS
                            </Link>
                            <span className={`${styles.footerBtn} ${styles.footerBtnCurrent}`}>
                                <LayoutGrid size={13} /> HRMS
                            </span>
                        </div>

                        {/* Sign out */}
                        <button className={`${styles.footerBtn} ${styles.footerBtnFull}`} onClick={handleLogout}>
                            <LogOut size={13} /> Sign out
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <main className={styles.main}>
                    <header className={styles.topbar}>
                        <button className={styles.mobileMenuBtn} onClick={() => setSidebar(true)}>
                            <Menu size={20} />
                        </button>
                        <span className={styles.topbarTitle}>{pageTitle}</span>
                        <span className={styles.topbarDate}>{today}</span>
                        <button className={styles.themeBtn} onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        {sidebarOpen && (
                            <button className={styles.mobileMenuBtn} onClick={() => setSidebar(false)}>
                                <X size={20} />
                            </button>
                        )}
                    </header>

                    <div className={styles.content}>
                        {children}
                    </div>
                </main>

            </div>
        </div>

        {showProfile && (
            <ProfileModal
                user={user}
                onClose={() => setShowProfile(false)}
                onUpdate={u => setUser(prev => prev ? { ...prev, ...u } : prev)}
            />
        )}
    </>
    )
}
