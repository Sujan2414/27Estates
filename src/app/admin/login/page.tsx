'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import styles from './admin-login.module.css'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                return
            }

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single()

            console.log('Profile check:', { profile, profileError, userId: authData.user.id })

            if (profileError) {
                await supabase.auth.signOut()
                setError(`Profile error: ${profileError.message}`)
                return
            }

            if (!profile) {
                await supabase.auth.signOut()
                setError('No profile found. Please contact administrator.')
                return
            }

            if (profile.role !== 'admin') {
                await supabase.auth.signOut()
                setError(`Access denied. Your role is: ${profile.role}. Admin role required.`)
                return
            }

            router.push('/admin')
            router.refresh()
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <Image src="/newlogo.png" alt="27 Estates" width={180} height={52} priority />
                    </div>
                    <h1 className={styles.title}>Admin Portal</h1>
                    <p className={styles.subtitle}>27 Estates Management</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="admin@27estates.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Signing in...' : 'Access Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    )
}
