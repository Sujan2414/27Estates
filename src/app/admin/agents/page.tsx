'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react'
import styles from '../admin.module.css'

interface Agent {
    id: string
    name: string
    email: string
    phone: string
    image: string
    role: string
    bio: string
    properties_count: number
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setAgents(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', id)

        if (!error) {
            setAgents(agents.filter(a => a.id !== id))
        }
        setDeleteId(null)
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Agents</h1>
                    <p className={styles.pageSubtitle}>Manage your property agents</p>
                </div>
                <Link href="/admin/agents/new" className={styles.addButton}>
                    <Plus size={18} />
                    Add Agent
                </Link>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading agents...</div>
            ) : agents.length > 0 ? (
                <div className={styles.agentsGrid}>
                    {agents.map((agent) => (
                        <div key={agent.id} className={styles.agentCard}>
                            <div className={styles.agentImageWrapper}>
                                {agent.image ? (
                                    <Image
                                        src={agent.image}
                                        alt={agent.name}
                                        fill
                                        className={styles.agentImage}
                                    />
                                ) : (
                                    <div className={styles.agentPlaceholder}>
                                        {agent.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className={styles.agentContent}>
                                <h3 className={styles.agentName}>{agent.name}</h3>
                                <p className={styles.agentRole}>{agent.role}</p>

                                <div className={styles.agentContact}>
                                    <a href={`mailto:${agent.email}`} className={styles.contactLink}>
                                        <Mail size={14} />
                                        <span>{agent.email}</span>
                                    </a>
                                    {agent.phone && (
                                        <a href={`tel:${agent.phone}`} className={styles.contactLink}>
                                            <Phone size={14} />
                                            <span>{agent.phone}</span>
                                        </a>
                                    )}
                                </div>

                                <div className={styles.agentActions}>
                                    <Link href={`/admin/agents/${agent.id}/edit`} className={styles.editBtn}>
                                        <Pencil size={16} />
                                        Edit
                                    </Link>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => setDeleteId(agent.id)}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No agents yet. Add your first agent!
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Delete Agent?</h3>
                        <p>This will remove the agent from all properties. This action cannot be undone.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
