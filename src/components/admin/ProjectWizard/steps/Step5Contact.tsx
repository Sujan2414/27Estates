'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../PropertyWizard/property-wizard.module.css'

interface Agent {
    id: string
    name: string
}

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function ProjectStep5Contact({ initialData, onNext, onBack }: StepProps) {
    const supabase = createClient()
    const [agents, setAgents] = useState<Agent[]>([])

    const [formData, setFormData] = useState({
        employee_name: initialData.employee_name || '',
        employee_phone: initialData.employee_phone || '',
        employee_email: initialData.employee_email || '',
        assigned_agent_id: initialData.assigned_agent_id || '',
    })

    useEffect(() => {
        const fetchAgents = async () => {
            const { data } = await supabase.from('agents').select('id, name').order('name')
            if (data) setAgents(data)
        }
        fetchAgents()
    }, [supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(formData)
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Contact Person</h2>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Name</label>
                    <input type="text" name="employee_name" value={formData.employee_name} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Phone</label>
                    <input type="text" name="employee_phone" value={formData.employee_phone} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input type="email" name="employee_email" value={formData.employee_email} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Assigned Agent</label>
                <select name="assigned_agent_id" value={formData.assigned_agent_id} onChange={handleChange} className={styles.select}>
                    <option value="">Select Agent</option>
                    {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onBack} className={`${styles.btn} ${styles.secondaryBtn}`}>
                    <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                    Next <ArrowRight size={18} />
                </button>
            </div>
        </form>
    )
}
