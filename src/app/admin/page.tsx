'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, FolderKanban, FileText, MessageSquare, Upload, Users, Plus, Briefcase, UserCheck, Landmark, Warehouse } from 'lucide-react'
import styles from './admin.module.css'

interface DashboardStats {
    properties: number
    projects: number
    commercial: number
    warehouse: number
    blogs: number
    inquiries: number
    submissions: number
    agents: number
    activeOpenings: number
    newApplications: number
}

interface RecentInquiry {
    id: string
    name: string
    email: string
    message: string
    status: string
    created_at: string
}

interface RecentApplication {
    id: string
    full_name: string
    email: string
    phone: string
    status: string
    created_at: string
    opening_title?: string
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        properties: 0,
        projects: 0,
        commercial: 0,
        warehouse: 0,
        blogs: 0,
        inquiries: 0,
        submissions: 0,
        agents: 0,
        activeOpenings: 0,
        newApplications: 0
    })
    const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([])
    const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // Fetch counts
            const [propertiesCount, projectsCount, commercialCount, warehouseCount, blogsCount, inquiriesCount, submissionsCount, agentsCount, openingsCount, newAppsCount] = await Promise.all([
                supabase.from('properties').select('id', { count: 'exact', head: true }),
                supabase.from('projects').select('id', { count: 'exact', head: true }).or('section.eq.residential,section.is.null'),
                supabase.from('projects').select('id', { count: 'exact', head: true }).eq('section', 'commercial'),
                supabase.from('projects').select('id', { count: 'exact', head: true }).eq('section', 'warehouse'),
                supabase.from('blogs').select('id', { count: 'exact', head: true }),
                supabase.from('inquiries').select('id', { count: 'exact', head: true }),
                supabase.from('property_submissions').select('id', { count: 'exact', head: true }),
                supabase.from('agents').select('id', { count: 'exact', head: true }),
                supabase.from('career_openings').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('career_applications').select('id', { count: 'exact', head: true }).eq('status', 'new')
            ])

            setStats({
                properties: propertiesCount.count || 0,
                projects: projectsCount.count || 0,
                commercial: commercialCount.count || 0,
                warehouse: warehouseCount.count || 0,
                blogs: blogsCount.count || 0,
                inquiries: inquiriesCount.count || 0,
                submissions: submissionsCount.count || 0,
                agents: agentsCount.count || 0,
                activeOpenings: openingsCount.count || 0,
                newApplications: newAppsCount.count || 0
            })

            // Fetch recent inquiries
            const { data: inquiries } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentInquiries(inquiries || [])

            // Fetch recent career applications
            const { data: apps } = await supabase
                .from('career_applications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            if (apps && apps.length > 0) {
                // Fetch opening titles
                const openingIds = [...new Set(apps.map(a => a.opening_id))]
                const { data: openings } = await supabase
                    .from('career_openings')
                    .select('id, title')
                    .in('id', openingIds)

                const titleMap: Record<string, string> = {}
                openings?.forEach(o => { titleMap[o.id] = o.title })

                setRecentApplications(apps.map(a => ({
                    ...a,
                    opening_title: titleMap[a.opening_id] || 'Unknown'
                })))
            }

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
                        <span className={styles.statLabel}>Total Projects</span>
                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                            <FolderKanban size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.projects}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Commercial</span>
                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                            <Landmark size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.commercial}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Warehouse</span>
                        <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                            <Warehouse size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.warehouse}</div>
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
                        <span className={styles.statLabel}>Submissions</span>
                        <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                            <Upload size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.submissions}</div>
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

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Active Openings</span>
                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.activeOpenings}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>New Applications</span>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                            <UserCheck size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats.newApplications}</div>
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
                    <Link href="/admin/projects/new" className={styles.addButton}>
                        <Plus size={18} />
                        New Project
                    </Link>
                    <Link href="/admin/commercial/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Commercial
                    </Link>
                    <Link href="/admin/warehouse/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Warehouse
                    </Link>
                    <Link href="/admin/blogs/new" className={styles.addButton}>
                        <Plus size={18} />
                        New Blog Post
                    </Link>
                    <Link href="/admin/agents/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Agent
                    </Link>
                    <Link href="/admin/careers/new" className={styles.addButton}>
                        <Plus size={18} />
                        New Opening
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

            {/* Recent Career Applications */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Applications</h2>
                    <Link href="/admin/careers/applications" className={styles.viewAllLink}>
                        View All
                    </Link>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>Loading...</div>
                ) : recentApplications.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentApplications.map((app) => (
                                <tr key={app.id}>
                                    <td>{app.full_name}</td>
                                    <td>{app.opening_title}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${app.status === 'new' ? styles.statusNew :
                                            app.status === 'shortlisted' ? styles.statusRead :
                                                styles.statusReplied
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(app.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>No applications yet</div>
                )}
            </div>
        </div>
    )
}
