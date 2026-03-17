'use client'

import { createContext, useContext } from 'react'

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
