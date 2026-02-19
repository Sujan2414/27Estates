'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from '../../admin.module.css'
import formStyles from '../../properties/form.module.css'
import ProjectWizard from '@/components/admin/ProjectWizard/ProjectWizard'

export default function NewProjectPage() {
    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/projects" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Add New Project</h1>
                    <p className={styles.pageSubtitle}>Create a new project listing</p>
                </div>
            </div>

            {/* Use the Wizard Component */}
            <ProjectWizard />
        </div>
    )
}
