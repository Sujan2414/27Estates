import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Employee {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  department: string | null
  designation: string | null
  avatar_url: string | null
  push_token: string | null
  is_active: boolean
  created_at: string
}

interface UseCurrentEmployeeResult {
  employee: Employee | null
  userId: string | null
  loading: boolean
}

export function useCurrentEmployee(): UseCurrentEmployeeResult {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!mounted) return
        if (authError || !user) {
          setLoading(false)
          return
        }

        setUserId(user.id)

        const { data, error: empError } = await supabase
          .from('employees')
          .select(
            'id, user_id, name, email, phone, role, department, designation, avatar_url, push_token, is_active, created_at'
          )
          .eq('user_id', user.id)
          .single()

        if (!mounted) return

        if (!empError && data) {
          setEmployee(data as Employee)
        }
      } catch {
        // Non-critical
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    // Listen for auth state changes (e.g. sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session) {
        setEmployee(null)
        setUserId(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { employee, userId, loading }
}
