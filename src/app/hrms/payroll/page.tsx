'use client'

/**
 * HRMS-mounted view of the same Payroll Control screen that lives at
 * /crm/hrm/payroll. Without this route, the HRMS sidebar's "Payroll
 * Control" link teleported the admin into the CRM section (different
 * sidebar, different chrome) — confusing context switch the user flagged.
 *
 * We re-render the existing CRM page component inside a thin wrapper
 * that:
 *   - injects the CRMContext (the page calls useCRMUser internally)
 *   - applies the .crmLayout class with data-theme matching the user's
 *     HRMS theme, so the page's CRM-scoped CSS variables resolve and
 *     the visual treatment matches the surrounding HRMS chrome
 *
 * No code is duplicated — this is just a route shim.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRMContext, type CRMUser, ThemeProvider } from '@/app/crm/crm-context'
import crmStyles from '@/app/crm/crm.module.css'
import CrmPayrollPage from '@/app/crm/hrm/payroll/page'

export default function HrmsPayrollPage() {
    const [user, setUser] = useState<CRMUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')

    // Mirror the HRMS theme so the CRM-styled content doesn't fight the
    // surrounding HRMS chrome (HRMS persists its theme in 'hrms-theme').
    useEffect(() => {
        try {
            const t = localStorage.getItem('hrms-theme')
            if (t === 'dark' || t === 'light') setTheme(t)
        } catch { /* SSR / incognito */ }
    }, [])

    useEffect(() => {
        const sb = createClient()
        sb.auth.getUser().then(async ({ data: { user: authUser } }) => {
            if (!authUser) { setLoading(false); return }
            const { data } = await sb
                .from('profiles')
                .select('id, full_name, email, role, reporting_manager_id, avatar_url')
                .eq('id', authUser.id)
                .maybeSingle()
            if (data) setUser(data as CRMUser)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-text-muted, #6b7280)' }}>Loading…</div>
    }
    if (!user) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-text-muted, #6b7280)' }}>Sign in required.</div>
    }
    if (user.role !== 'super_admin') {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Restricted</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Payroll Control is super-admin only.</div>
            </div>
        )
    }

    return (
        <ThemeProvider>
            <div className={crmStyles.crmLayout} data-theme={theme} style={{ minHeight: '100%' }}>
                <CRMContext.Provider value={user}>
                    <CrmPayrollPage />
                </CRMContext.Provider>
            </div>
        </ThemeProvider>
    )
}
