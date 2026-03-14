'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from '../../admin.module.css'
import formStyles from '../../properties/form.module.css'
import ProjectWizard from '@/components/admin/ProjectWizard/ProjectWizard'

export default function NewWarehousePage() {
    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/warehouse" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Add Warehouse Listing</h1>
                    <p className={styles.pageSubtitle}>Create a new warehouse & industrial listing</p>
                </div>
            </div>

            <ProjectWizard section="warehouse" />
        </div>
    )
}
