'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type CRMRole = 'super_admin' | 'admin' | 'agent'

export interface CRMUser {
    id: string
    full_name: string
    role: CRMRole
}

export const CRMContext = createContext<CRMUser | null>(null)

export function useCRMUser(): CRMUser | null {
    return useContext(CRMContext)
}

// Role helpers
export const isSuperAdmin = (u: CRMUser | null) => u?.role === 'super_admin'
export const isAdmin = (u: CRMUser | null) => u?.role === 'super_admin' || u?.role === 'admin'
export const isAgent = (u: CRMUser | null) => u?.role === 'agent'

// ── Theme ──────────────────────────────────────────────
export type CRMTheme = 'light' | 'dark'

interface ThemeContextValue {
    theme: CRMTheme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'light',
    toggleTheme: () => {},
})

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext)
}

const STORAGE_KEY = 'crm-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<CRMTheme>('light')
    const [mounted, setMounted] = useState(false)

    // Read persisted theme on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as CRMTheme | null
            if (stored === 'dark' || stored === 'light') {
                setTheme(stored)
            }
        } catch { /* SSR / incognito */ }
        setMounted(true)
    }, [])

    // Persist theme changes
    useEffect(() => {
        if (!mounted) return
        try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* silent */ }
    }, [theme, mounted])

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

// ── Financial Year Helpers ─────────────────────────────
// Current financial year (April–March, Indian standard)
export function getCurrentFY(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 1–12
    if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`
    return `${year - 1}-${String(year).slice(-2)}`
}

// FY start/end dates for DB queries
export function getFYDates(fy: string): { start: string; end: string } {
    const startYear = parseInt(fy.split('-')[0])
    return {
        start: `${startYear}-04-01`,
        end: `${startYear + 1}-03-31`,
    }
}

// Generate selectable FY options (prev, current, next)
export function getFYOptions(): string[] {
    const current = getCurrentFY()
    const [y] = current.split('-').map(Number)
    return [
        `${y - 1}-${String(y).slice(-2)}`,
        current,
        `${y + 1}-${String(y + 2).slice(-2)}`,
    ]
}
