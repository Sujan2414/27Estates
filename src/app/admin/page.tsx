'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, FileText, MessageSquare, Users, Plus } from 'lucide-react'
import styles from './admin.module.css'

interface DashboardStats {
    properties: number
    blogs: number
    inquiries: number
    agents: number
}

interface RecentInquiry {
    id: string
    name: string
    email: string
    message: string
    status: string
    created_at: string
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        properties: 0,
        blogs: 0,
        inquiries: 0,
        agents: 0
    })
    const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // Fetch counts
            const [propertiesCount, blogsCount, inquiriesCount, agentsCount] = await Promise.all([
                supabase.from('properties').select('id', { count: 'exact', head: true }),
                supabase.from('blogs').select('id', { count: 'exact', head: true }),
                supabase.from('inquiries').select('id', { count: 'exact', head: true }),
                supabase.from('agents').select('id', { count: 'exact', head: true })
            ])

            setStats({
                properties: propertiesCount.count || 0,
                blogs: blogsCount.count || 0,
                inquiries: inquiriesCount.count || 0,
                agents: agentsCount.count || 0
            })

            // Fetch recent inquiries
            const { data: inquiries } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentInquiries(inquiries || [])
            setLoading(false)
        }

        fetchData()
    }, [supabase])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Welcome back! Here&apos;s an overview of your properties.</p>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Total Properties</span>
                        <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
                            <Building2 size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.properties}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Blog Posts</span>
                        <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.blogs}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Inquiries</span>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                            <MessageSquare size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.inquiries}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Agents</span>
                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.agents}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href="/admin/properties/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Property
                    </Link>
                    <Link href="/admin/blogs/new" className={styles.addButton}>
                        <Plus size={18} />
                        New Blog Post
                    </Link>
                    <Link href="/admin/agents/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Agent
                    </Link>
                </div>
            </div>

            {/* Recent Inquiries */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Inquiries</h2>
                    <Link href="/admin/inquiries" className={styles.viewAllLink}>
                        View All
                    </Link>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>Loading...</div>
                ) : recentInquiries.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentInquiries.map((inquiry) => (
                                <tr key={inquiry.id}>
                                    <td>{inquiry.name}</td>
                                    <td>{inquiry.email}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${inquiry.status === 'new' ? styles.statusNew :
                                                inquiry.status === 'read' ? styles.statusRead :
                                                    styles.statusReplied
                                            }`}>
                                            {inquiry.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(inquiry.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>No inquiries yet</div>
                )}
            </div>
        </div>
    )
}
