'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';

/* ── Shared inline styles matching Dashboard.module.css design system ── */
const BRAND = '#183C38';
const BRAND_HOVER = '#2d7a6e';
const BORDER = '#e5e5e5';
const LABEL_COLOR = '#525252';
const TEXT = '#0a0a0a';

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: TEXT,
    backgroundColor: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: LABEL_COLOR,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
};

const sectionTitle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: BRAND,
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${BORDER}`,
};

const projectTypeOptions = [
    'Apartment', 'Villa', 'Plot', 'Commercial', 'Duplex', 'Penthouse', 'Farmhouse', 'Row Villa'
];

const projectStatusOptions = [
    'Upcoming', 'Under Construction', 'Ready to Move', 'New Launch'
];

export default function PostProjectForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        project_name: '',
        project_type: '',
        project_status: '',
        budget_range: '',
        location: '',
        description: '',
    });

    const supabase = createClient();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);
            const newUrls = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadImages = async (): Promise<string[]> => {
        if (images.length === 0) return [];
        const bucket = 'submission-images';

        const uploadPromises = images.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return publicUrl;
        });

        const results = await Promise.all(uploadPromises);
        return results.filter((url): url is string => url !== null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const uploadedImageUrls = await uploadImages();
            const { data: { user } } = await supabase.auth.getUser();

            const { error: insertError } = await supabase
                .from('property_submissions')
                .insert([{
                    user_id: user?.id || null,
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    property_type: 'Sale',
                    deal_type: formData.project_type,
                    property_category: 'Project',
                    property_details: `Project: ${formData.project_name}\nType: ${formData.project_type}\nStatus: ${formData.project_status}\nBudget: ${formData.budget_range}\nLocation: ${formData.location}\n\n${formData.description}`,
                    expected_price: null,
                    images: uploadedImageUrls,
                    status: 'new'
                }]);

            if (insertError) throw insertError;
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Error submitting project:', err);
            setError(err.message || 'Failed to submit project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Success View ── */
    if (isSuccess) {
        return (
            <div style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '14px',
                padding: '48px 24px',
                textAlign: 'center',
            }}>
                <div style={{
                    width: 56, height: 56,
                    borderRadius: '50%',
                    background: 'rgba(34,197,94,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                }}>
                    <CheckCircle size={28} color="#22c55e" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: TEXT, marginBottom: 8 }}>
                    Project Submitted Successfully!
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#737373', maxWidth: 400, margin: '0 auto 24px' }}>
                    Our team will review your project and get back to you within 24 hours.
                </p>
                <button
                    onClick={() => {
                        setIsSuccess(false);
                        setFormData({ name: '', phone: '', email: '', project_name: '', project_type: '', project_status: '', budget_range: '', location: '', description: '' });
                        setImages([]);
                        setImagePreviews([]);
                    }}
                    style={{
                        padding: '10px 24px',
                        background: BRAND,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Submit Another Project
                </button>
            </div>
        );
    }

    /* ── Form View ── */
    return (
        <div style={{
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: '14px',
            overflow: 'hidden',
        }}>
            <form onSubmit={handleSubmit}>
                {/* ── Section 1: Contact ── */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={sectionTitle}>Contact Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="John Doe"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone *</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="+91 98XXXXXXXX"
                                required
                                value={formData.phone}
                                onChange={handleInputChange}
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Email *</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="john@example.com"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Project Details ── */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={sectionTitle}>Project Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Project Name *</label>
                            <input
                                type="text"
                                name="project_name"
                                placeholder="e.g. Green Valley Heights"
                                required
                                value={formData.project_name}
                                onChange={handleInputChange}
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Project Type *</label>
                            <select
                                name="project_type"
                                required
                                value={formData.project_type}
                                onChange={handleInputChange}
                                style={{ ...inputStyle, appearance: 'none' as any, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                <option value="" disabled>Select type</option>
                                {projectTypeOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Project Status *</label>
                            <select
                                name="project_status"
                                required
                                value={formData.project_status}
                                onChange={handleInputChange}
                                style={{ ...inputStyle, appearance: 'none' as any, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                <option value="" disabled>Select status</option>
                                {projectStatusOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Budget Range</label>
                            <input
                                type="text"
                                name="budget_range"
                                placeholder="e.g. 50L - 1.5Cr"
                                value={formData.budget_range}
                                onChange={handleInputChange}
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Location / City *</label>
                            <input
                                type="text"
                                name="location"
                                placeholder="e.g. Pune, Hinjewadi"
                                required
                                value={formData.location}
                                onChange={handleInputChange}
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            name="description"
                            placeholder="Amenities, number of units, USPs, etc."
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            style={{ ...inputStyle, resize: 'none' as any }}
                            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px rgba(24,60,56,0.08)`; }}
                            onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>
                </div>

                {/* ── Section 3: Images ── */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={sectionTitle}>Project Images</div>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${BORDER}`,
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BRAND; (e.currentTarget as HTMLDivElement).style.background = 'rgba(24,60,56,0.03)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                        <Upload size={24} color="#a3a3a3" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#525252', margin: 0 }}>Click to upload images</p>
                        <p style={{ fontSize: '0.6875rem', color: '#a3a3a3', marginTop: 4 }}>PNG, JPG, WEBP up to 10MB each</p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    {imagePreviews.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                            {imagePreviews.map((url, index) => (
                                <div key={index} style={{ position: 'relative', width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                                    <img src={url} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        style={{
                                            position: 'absolute', top: 2, right: 2,
                                            background: 'rgba(0,0,0,0.6)', color: '#fff',
                                            border: 'none', borderRadius: '50%',
                                            width: 18, height: 18,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', padding: 0,
                                        }}
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div style={{
                        margin: '12px 24px 0',
                        padding: '10px 14px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        fontSize: '0.8125rem',
                        color: '#dc2626',
                    }}>
                        {error}
                    </div>
                )}

                {/* ── Submit ── */}
                <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            padding: '10px 28px',
                            background: BRAND,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 0.2s',
                            letterSpacing: '0.02em',
                        }}
                        onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = BRAND_HOVER; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = BRAND; }}
                    >
                        {isLoading ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                        ) : (
                            'Submit Project'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
