'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from '../../admin.module.css'
import formStyles from '../form.module.css'
import PropertyWizard from '@/components/admin/PropertyWizard/PropertyWizard'

export default function NewPropertyPage() {
    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/properties" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Add New Property</h1>
                    <p className={styles.pageSubtitle}>Create a new property listing</p>
                </div>
            </div>

            {/* Use the new Wizard Component */}
            <PropertyWizard />
        </div>
    )
}
