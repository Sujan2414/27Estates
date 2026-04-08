import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type LeadFilter = 'all' | 'mine' | 'hot' | 'warm' | 'cold' | 'follow_up'

export interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string | null
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'site_visit' | 'converted' | 'lost'
  priority: 'hot' | 'warm' | 'cold'
  property_interest: string | null
  project_interest: string | null
  budget_min: number | null
  budget_max: number | null
  next_follow_up_at: string | null
  created_at: string
  assigned_to: string | null
}

interface UseLeadsResult {
  leads: Lead[]
  loading: boolean
  refreshing: boolean
  refresh: () => void
  error: string | null
}

export function useLeads(filter: LeadFilter = 'all'): UseLeadsResult {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Resolve the current user once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      setUserId(user?.id ?? null)
    })
  }, [])

  const fetchLeads = useCallback(async () => {
    if (!userId) return

    setError(null)

    try {
      let query = supabase
        .from('leads')
        .select(
          'id, name, phone, email, source, status, priority, property_interest, project_interest, budget_min, budget_max, next_follow_up_at, created_at, assigned_to'
        )
        .order('created_at', { ascending: false })
        .limit(100)

      switch (filter) {
        case 'mine':
          query = query.eq('assigned_to', userId)
          break
        case 'hot':
          query = query.eq('priority', 'hot')
          break
        case 'warm':
          query = query.eq('priority', 'warm')
          break
        case 'cold':
          query = query.eq('priority', 'cold')
          break
        case 'follow_up': {
          const now = new Date().toISOString()
          query = query
            .lte('next_follow_up_at', now)
            .not('status', 'in', '("lost","converted")')
          break
        }
        case 'all':
        default:
          break
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setLeads((data as Lead[]) ?? [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leads.'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, filter])

  // Fetch when userId or filter changes
  useEffect(() => {
    if (userId) {
      setLoading(true)
      fetchLeads()
    }
  }, [userId, filter, fetchLeads])

  const refresh = useCallback(() => {
    setRefreshing(true)
    fetchLeads()
  }, [fetchLeads])

  return { leads, loading, refreshing, refresh, error }
}
