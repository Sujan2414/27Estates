'use client'

import { useState } from 'react'
import { User, FileText, MapPin, BarChart2, Settings, Globe } from 'lucide-react'
import styles from './property-wizard.module.css'
import PropertyContactStep from './steps/Step1Contact'
import PropertyBasicStep from './steps/Step2Basic'
import PropertyLocationStep from './steps/Step3Location'
import PropertyAreaStep from './steps/Step4Area'
import PropertyDetailsStep from './steps/Step5Details'
import PropertyPublishStep from './steps/Step6Publish'

const STEPS = [
    { id: 1, label: 'Contact Information', icon: User },
    { id: 2, label: 'Basic Information', icon: FileText },
    { id: 3, label: 'Location', icon: MapPin },
    { id: 4, label: 'Area and Pricing', icon: BarChart2 },
    { id: 5, label: 'Other details', icon: Settings },
    { id: 6, label: 'Save and Publish', icon: Globe },
]

export default function PropertyWizard() {
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
                {currentStep === 1 && <PropertyContactStep initialData={formData} onNext={handleNext} />}
                {currentStep === 2 && <PropertyBasicStep initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 3 && <PropertyLocationStep initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 4 && <PropertyAreaStep initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 5 && <PropertyDetailsStep initialData={formData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 6 && <PropertyPublishStep initialData={formData} onNext={() => { }} onBack={handleBack} />}
            </div>
        </div>
    )
}
