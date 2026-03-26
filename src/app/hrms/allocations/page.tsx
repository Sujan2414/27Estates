'use client'
import Link from 'next/link'
import { ArrowRight, Sliders } from 'lucide-react'
import styles from '../hrms.module.css'

export default function HRMSAllocationsRedirect() {
    return (
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Sliders size={40} style={{ margin: '0 auto 1rem', color: 'var(--h-text-4)' }} />
            <div className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Leave Allocations</div>
            <div className={styles.pageSubtitle} style={{ marginBottom: '1.5rem' }}>Manage annual leave allocations for all employees</div>
            <Link href="/crm/hrm/allocations" className={`${styles.btn} ${styles.btnPrimary}`} style={{ display: 'inline-flex', margin: '0 auto' }}>
                Open in CRM <ArrowRight size={15} />
            </Link>
        </div>
    )
}
