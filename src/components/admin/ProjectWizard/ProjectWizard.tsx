'use client'

import { useState } from 'react'
import { FileText, DollarSign, MapPin, Settings, User, Globe } from 'lucide-react'
import styles from '../PropertyWizard/property-wizard.module.css'
import ProjectStep1Basic from './steps/Step1Basic'
import ProjectStep2Pricing from './steps/Step2Pricing'
import ProjectStep3Location from './steps/Step3Location'
import ProjectStep4Details from './steps/Step4Details'
import ProjectStep5Contact from './steps/Step5Contact'
import ProjectStep6Publish from './steps/Step6Publish'

const STEPS = [
    { id: 1, label: 'Basic Information', icon: FileText },
    { id: 2, label: 'Pricing & Dates', icon: DollarSign },
    { id: 3, label: 'Location', icon: MapPin },
    { id: 4, label: 'Project Details', icon: Settings },
    { id: 5, label: 'Contact Person', icon: User },
    { id: 6, label: 'Media & Publish', icon: Globe },
]

export default function ProjectWizard() {
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({})

    const handleNext = (data: any) => {
        setFormData(prev => ({ ...prev, ...data }))
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    return (
        <div className={styles.wizardContainer}>
            {/* Stepper Header */}
            <div className={styles.stepper}>
                {STEPS.map((step) => {
                    const isActive = step.id === currentStep
                    const isCompleted = step.id < currentStep
                    const Icon = step.icon

                    return (
                        <div
                            key={step.id}
                            className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                            onClick={() => isCompleted ? setCurrentStep(step.id) : null}
                        >
                            <div className={styles.stepIcon}>
                                <Icon size={20} />
                            </div>
                            <span className={styles.stepLabel}>{step.label}</span>
                        </div>
                    )
                })}
            </div>

            {/* Step Content */}
            <div className={styles.stepContent}>
                {currentStep === 1 && <ProjectStep1Basic initialData={formData} onNext={handleNext} />}
                {currentStep === 2 && <ProjectStep2Pricing initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 3 && <ProjectStep3Location initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 4 && <ProjectStep4Details initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 5 && <ProjectStep5Contact initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 6 && <ProjectStep6Publish initialData={formData} onNext={() => { }} onBack={handleBack} />}
            </div>
        </div>
    )
}
