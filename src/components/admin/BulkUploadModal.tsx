'use client'

import { useState, useRef, useCallback } from 'react'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { X, Download, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import {
    generatePropertyTemplate,
    generateProjectTemplate,
    parsePropertyExcel,
    parseProjectExcel,
    exportPropertiesToExcel,
    exportProjectsToExcel,
    type ParsedProperty,
    type ParsedProject,
} from '@/lib/admin/bulkUtils'

interface BulkUploadModalProps {
    type: 'property' | 'project'
    onClose: () => void
    onComplete: () => void
}

type UploadStage = 'idle' | 'parsed' | 'uploading' | 'done'

export default function BulkUploadModal({ type, onClose, onComplete }: BulkUploadModalProps) {
    const [stage, setStage] = useState<UploadStage>('idle')
    const [parsedProperties, setParsedProperties] = useState<ParsedProperty[]>([])
    const [parsedProjects, setParsedProjects] = useState<ParsedProject[]>([])
    const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([])
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0, failed: 0 })
    const [uploadErrors, setUploadErrors] = useState<{ row: number; message: string }[]>([])
    const [dragOver, setDragOver] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const supabase = createAdminBrowserClient()

    const handleDownloadTemplate = () => {
        if (type === 'property') generatePropertyTemplate()
        else generateProjectTemplate()
    }

    const handleDownloadExisting = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile?.role === 'agent') {
                alert('Restricted: Please contact admin to download data.')
                return
            }
        }

        if (type === 'property') {
            const { data } = await supabase.from('properties').select('*')
            if (data && data.length > 0) exportPropertiesToExcel(data)
            else alert('No properties to export')
        } else {
            const { data } = await supabase.from('projects').select('*')
            if (data && data.length > 0) exportProjectsToExcel(data)
            else alert('No projects to export')
        }
    }

    const handleFile = useCallback(async (file: File) => {
        if (!file.name.match(/\.xlsx?$/i)) {
            alert('Please upload an Excel (.xlsx) file')
            return
        }

        try {
            if (type === 'property') {
                const result = await parsePropertyExcel(file)
                setParsedProperties(result.valid)
                setParseErrors(result.errors)
            } else {
                const result = await parseProjectExcel(file)
                setParsedProjects(result.valid)
                setParseErrors(result.errors)
            }
            setStage('parsed')
        } catch {
            alert('Failed to parse the Excel file. Please check the format.')
        }
    }, [type])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleUpload = async () => {
        setStage('uploading')
        const errors: { row: number; message: string }[] = []
        let done = 0
        let failed = 0

        if (type === 'property') {
            const total = parsedProperties.length
            setUploadProgress({ done: 0, total, failed: 0 })

            for (let i = 0; i < parsedProperties.length; i++) {
                const p = parsedProperties[i]
                const { error } = await supabase.from('properties').insert({
                    property_id: p.property_id,
                    title: p.title,
                    description: p.description || null,
                    price: p.price,
                    price_per_sqft: p.price_per_sqft,
                    location: p.location,
                    bedrooms: p.bedrooms,
                    bathrooms: p.bathrooms,
                    sqft: p.sqft,
                    lot_size: p.lot_size,
                    floors: p.floors,
                    rooms: p.rooms,
                    property_type: p.property_type,
                    category: p.category,
                    is_featured: p.is_featured,
                    video_url: p.video_url,
                    images: p.images,
                    address: p.address,
                    amenities: p.amenities,
                    floor_plans: p.floor_plans && p.floor_plans.length > 0 ? p.floor_plans : null,
                })

                if (error) {
                    failed++
                    errors.push({ row: i + 2, message: error.message })
                } else {
                    done++
                }
                setUploadProgress({ done, total, failed })
            }
        } else {
            const total = parsedProjects.length
            setUploadProgress({ done: 0, total, failed: 0 })

            for (let i = 0; i < parsedProjects.length; i++) {
                const p = parsedProjects[i]

                // Build address object
                const addressObj = {
                    address: p.address,
                    location: p.location,
                    city: p.city,
                    state: p.state,
                    landmark: p.landmark,
                    pincode: p.pincode,
                    country: 'India',
                    latitude: null,
                    longitude: null,
                }

                const { error } = await supabase.from('projects').insert({
                    project_id: p.project_id,
                    project_name: p.project_name,
                    title: p.title || p.project_name,
                    description: p.description || null,
                    rera_number: p.rera_number,
                    developer_name: p.developer_name,
                    status: p.status,
                    category: p.category,
                    sub_category: p.sub_category,
                    total_units: p.total_units,
                    min_price: p.min_price,
                    max_price: p.max_price,
                    min_price_numeric: p.min_price_numeric,
                    max_price_numeric: p.max_price_numeric,
                    price_per_sqft: p.price_per_sqft,
                    min_area: p.min_area,
                    max_area: p.max_area,
                    property_type: p.property_type,
                    bhk_options: p.bhk_options.length > 0 ? p.bhk_options : null,
                    transaction_type: p.transaction_type,
                    launch_date: p.launch_date,
                    possession_date: p.possession_date,
                    video_url: p.video_url,
                    brochure_url: p.brochure_url,
                    master_plan_image: p.master_plan_image,
                    is_featured: p.is_featured,
                    is_rera_approved: p.is_rera_approved,
                    employee_name: p.employee_name,
                    employee_phone: p.employee_phone,
                    employee_email: p.employee_email,
                    address: addressObj,
                    location: p.location,
                    city: p.city,
                    state: p.state,
                    images: p.images,
                    amenities: Object.keys(p.amenities).length > 0 ? p.amenities : null,
                    floor_plans: p.floor_plans,
                    connectivity: p.connectivity,
                    highlights: p.highlights,
                    towers_data: p.towers_data,
                    unit_configs: p.unit_configs,
                })

                if (error) {
                    failed++
                    errors.push({ row: i + 2, message: error.message })
                } else {
                    done++
                }
                setUploadProgress({ done, total, failed })
            }
        }

        setUploadErrors(errors)
        setStage('done')
        if (done > 0) onComplete()
    }

    const validCount = type === 'property' ? parsedProperties.length : parsedProjects.length
    const label = type === 'property' ? 'Properties' : 'Projects'

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a1a2e' }}>
                        Bulk Import {label}
                    </h2>
                    <button onClick={onClose} style={closeBtnStyle}>
                        <X size={20} />
                    </button>
                </div>

                {/* Actions Bar */}
                <div style={actionsBarStyle}>
                    <button onClick={handleDownloadTemplate} style={templateBtnStyle}>
                        <Download size={16} />
                        Download Template
                    </button>
                    <button onClick={handleDownloadExisting} style={exportBtnStyle}>
                        <FileSpreadsheet size={16} />
                        Export Existing
                    </button>
                </div>

                {/* Content */}
                {stage === 'idle' && (
                    <div
                        style={{
                            ...dropZoneStyle,
                            borderColor: dragOver ? '#0d9488' : '#d1d5db',
                            backgroundColor: dragOver ? '#f0fdfa' : '#fafafa',
                        }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload size={40} color="#9ca3af" />
                        <p style={{ margin: '12px 0 4px', fontWeight: 600, color: '#374151' }}>
                            Drop your Excel file here
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                            or click to browse (.xlsx)
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}

                {stage === 'parsed' && (
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {/* Parse Summary */}
                        <div style={summaryStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20} color="#10b981" />
                                <span style={{ fontWeight: 600 }}>{validCount} valid {label.toLowerCase()}</span>
                            </div>
                            {parseErrors.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                                    <AlertCircle size={20} />
                                    <span>{parseErrors.length} errors</span>
                                </div>
                            )}
                        </div>

                        {/* Parse Errors */}
                        {parseErrors.length > 0 && (
                            <div style={errorsBoxStyle}>
                                <strong>Errors (these rows will be skipped):</strong>
                                {parseErrors.map((e, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                        Row {e.row}: {e.message}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Preview Table */}
                        {validCount > 0 && (
                            <div style={previewTableContainerStyle}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>#</th>
                                            {type === 'property' ? (
                                                <>
                                                    <th style={thStyle}>ID</th>
                                                    <th style={thStyle}>Title</th>
                                                    <th style={thStyle}>Price</th>
                                                    <th style={thStyle}>Location</th>
                                                    <th style={thStyle}>Category</th>
                                                    <th style={thStyle}>Beds</th>
                                                    <th style={thStyle}>Images</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th style={thStyle}>ID</th>
                                                    <th style={thStyle}>Name</th>
                                                    <th style={thStyle}>Location</th>
                                                    <th style={thStyle}>Category</th>
                                                    <th style={thStyle}>Status</th>
                                                    <th style={thStyle}>Units</th>
                                                    <th style={thStyle}>Images</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {type === 'property' ? parsedProperties.slice(0, 50).map((p, i) => (
                                            <tr key={i}>
                                                <td style={tdStyle}>{i + 1}</td>
                                                <td style={tdStyle}>{p.property_id}</td>
                                                <td style={tdStyle}>{p.title}</td>
                                                <td style={tdStyle}>₹{p.price.toLocaleString('en-IN')}</td>
                                                <td style={tdStyle}>{p.location}</td>
                                                <td style={tdStyle}>{p.category}</td>
                                                <td style={tdStyle}>{p.bedrooms}</td>
                                                <td style={tdStyle}>{p.images.length}</td>
                                            </tr>
                                        )) : parsedProjects.slice(0, 50).map((p, i) => (
                                            <tr key={i}>
                                                <td style={tdStyle}>{i + 1}</td>
                                                <td style={tdStyle}>{p.project_id}</td>
                                                <td style={tdStyle}>{p.project_name}</td>
                                                <td style={tdStyle}>{p.location}</td>
                                                <td style={tdStyle}>{p.category}</td>
                                                <td style={tdStyle}>{p.status}</td>
                                                <td style={tdStyle}>{p.total_units ?? '-'}</td>
                                                <td style={tdStyle}>{p.images.length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {validCount > 50 && (
                                    <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
                                        Showing first 50 of {validCount} rows
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Import Button */}
                        {validCount > 0 && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button onClick={() => { setStage('idle'); setParsedProperties([]); setParsedProjects([]); setParseErrors([]) }} style={secondaryBtnStyle}>
                                    Cancel
                                </button>
                                <button onClick={handleUpload} style={importBtnStyle}>
                                    <Upload size={16} />
                                    Import {validCount} {label}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {stage === 'uploading' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                        <Loader2 size={40} className="animate-spin" color="#0d9488" />
                        <p style={{ fontWeight: 600, color: '#1a1a2e' }}>
                            Importing {label.toLowerCase()}...
                        </p>
                        <div style={progressBarContainer}>
                            <div style={{
                                ...progressBarFill,
                                width: `${uploadProgress.total > 0 ? ((uploadProgress.done + uploadProgress.failed) / uploadProgress.total * 100) : 0}%`
                            }} />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {uploadProgress.done + uploadProgress.failed} / {uploadProgress.total} processed
                            {uploadProgress.failed > 0 && <span style={{ color: '#ef4444' }}> ({uploadProgress.failed} failed)</span>}
                        </p>
                    </div>
                )}

                {stage === 'done' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                        <CheckCircle size={48} color="#10b981" />
                        <h3 style={{ margin: 0, color: '#1a1a2e' }}>Import Complete</h3>
                        <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#374151' }}>
                            <p><strong>{uploadProgress.done}</strong> {label.toLowerCase()} imported successfully</p>
                            {uploadProgress.failed > 0 && (
                                <p style={{ color: '#ef4444' }}><strong>{uploadProgress.failed}</strong> failed</p>
                            )}
                        </div>

                        {uploadErrors.length > 0 && (
                            <div style={errorsBoxStyle}>
                                <strong>Failed rows:</strong>
                                {uploadErrors.map((e, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                        Row {e.row}: {e.message}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={onClose} style={importBtnStyle}>
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Styles ──────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
}

const modalStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
}

const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#6b7280',
    borderRadius: '8px',
    display: 'flex',
}

const actionsBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderBottom: '1px solid #f3f4f6',
    flexWrap: 'wrap',
}

const templateBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: '#0d9488',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
}

const exportBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
}

const dropZoneStyle: React.CSSProperties = {
    margin: '24px',
    padding: '48px 24px',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
}

const summaryStyle: React.CSSProperties = {
    display: 'flex',
    gap: '24px',
    padding: '16px 24px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
}

const errorsBoxStyle: React.CSSProperties = {
    margin: '12px 24px',
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    fontSize: '0.9rem',
    maxHeight: '150px',
    overflowY: 'auto',
}

const previewTableContainerStyle: React.CSSProperties = {
    padding: '0 24px',
    overflow: 'auto',
    maxHeight: '300px',
}

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
}

const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    background: '#fff',
}

const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
    color: '#4b5563',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}

const importBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#0d9488',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginLeft: 'auto',
}

const secondaryBtnStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
}

const progressBarContainer: React.CSSProperties = {
    width: '80%',
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
}

const progressBarFill: React.CSSProperties = {
    height: '100%',
    background: '#0d9488',
    borderRadius: '4px',
    transition: 'width 0.3s',
}
