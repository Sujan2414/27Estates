'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, ArrowRight } from 'lucide-react'
import styles from '../property-wizard.module.css'

interface StepProps {
    initialData: any
    onNext: (data: any) => void
}

export default function PropertyContactStep({ initialData, onNext }: StepProps) {
    const supabase = createClient()
    const [agents, setAgents] = useState<{ id: string, name: string }[]>([])
    const [selectedAgent, setSelectedAgent] = useState(initialData.agent_id || '')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAgents() {
            const { data } = await supabase.from('agents').select('id, name')
            if (data) setAgents(data)
            setLoading(false)
        }
        fetchAgents()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAgent) {
            alert('Please select an Owner/Landlord')
            return
        }
        onNext({ agent_id: selectedAgent })
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Give us some information about Owner Or Landlord</h2>

            <div className={styles.field} style={{ maxWidth: '600px', margin: '0 auto' }}>
                <label className={styles.label}>Owner/Landlord <span>*</span></label>
                <select
                    className={styles.select}
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    required
                >
                    <option value="">Select</option>
                    {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.actions} style={{ justifyContent: 'center' }}>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                    CONTINUE <ArrowRight size={16} />
                </button>
                <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={() => window.history.back()}>
                    CANCEL
                </button>
                <button type="button" className={`${styles.btn} ${styles.successBtn}`}>
                    <UserPlus size={16} /> ADD NEW CONTACT
                </button>
            </div>

            {loading && <div className={styles.loadingOverlay}>Loading agents...</div>}
        </form>
    )
}
