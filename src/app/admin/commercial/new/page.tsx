'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from '../../admin.module.css'
import formStyles from '../../properties/form.module.css'
import ProjectWizard from '@/components/admin/ProjectWizard/ProjectWizard'

export default function NewCommercialPage() {
    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/commercial" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Add Commercial Listing</h1>
                    <p className={styles.pageSubtitle}>Create a new commercial project listing</p>
                </div>
            </div>

            <ProjectWizard section="commercial" />
        </div>
    )
}
