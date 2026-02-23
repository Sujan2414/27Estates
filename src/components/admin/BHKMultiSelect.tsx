'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

// Common BHK options on the site filters
const BHK_OPTIONS = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK']

interface BHKMultiSelectProps {
    value: string // comma-separated string, e.g., "1 BHK, 2 BHK, 3 BHK"
    onChange: (value: string) => void
    label?: string
    placeholder?: string
}

export default function BHKMultiSelect({
    value,
    onChange,
    placeholder = 'Select BHK Options'
}: BHKMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Convert comma-separated string to array
    const selectedOptions = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

    const toggleOption = (opt: string) => {
        let newSelected: string[]
        if (selectedOptions.includes(opt)) {
            newSelected = selectedOptions.filter(o => o !== opt)
        } else {
            newSelected = [...selectedOptions, opt]
        }
        onChange(newSelected.join(', '))
    }

    const removeOption = (e: React.MouseEvent, opt: string) => {
        e.stopPropagation()
        const newSelected = selectedOptions.filter(o => o !== opt)
        onChange(newSelected.join(', '))
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

            {/* Display / Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '42px',
                    padding: '6px 12px',
                    border: isOpen ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                    outline: isOpen ? '2px solid rgba(14, 165, 233, 0.2)' : 'none',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1, paddingRight: '8px' }}>
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span
                                key={opt}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '2px 8px',
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    color: '#334155',
                                    fontWeight: 500
                                }}
                            >
                                {opt}
                                <button
                                    type="button"
                                    onClick={(e) => removeOption(e, opt)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        display: 'flex',
                                        cursor: 'pointer',
                                        color: '#64748b'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', paddingTop: '4px' }}>
                            {placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown size={18} color="#64748b" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 50,
                        maxHeight: '220px',
                        overflowY: 'auto'
                    }}
                >
                    {BHK_OPTIONS.map(opt => {
                        const isSelected = selectedOptions.includes(opt)
                        return (
                            <div
                                key={opt}
                                onClick={() => toggleOption(opt)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                                    color: isSelected ? '#0369a1' : '#334155',
                                    fontSize: '0.9rem',
                                    transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    border: isSelected ? '1px solid #0ea5e9' : '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isSelected ? '#0ea5e9' : 'transparent'
                                }}>
                                    {isSelected && <Check size={14} color="white" />}
                                </div>
                                <span style={{ fontWeight: isSelected ? 500 : 400 }}>{opt}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
