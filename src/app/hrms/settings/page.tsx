'use client'
import Link from 'next/link'
import { ArrowRight, Settings } from 'lucide-react'
import styles from '../hrms.module.css'

export default function HRMSSettingsRedirect() {
    return (
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Settings size={40} style={{ margin: '0 auto 1rem', color: 'var(--h-text-4)' }} />
            <div className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Work Settings</div>
            <div className={styles.pageSubtitle} style={{ marginBottom: '1.5rem' }}>Configure work hours, check-in reminders, and regularisation limits</div>
            <Link href="/crm/hrm/work-settings" className={`${styles.btn} ${styles.btnPrimary}`} style={{ display: 'inline-flex', margin: '0 auto' }}>
                Open in CRM <ArrowRight size={15} />
            </Link>
        </div>
    )
}
