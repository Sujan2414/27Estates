'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, ArrowUpRight, ChevronDown } from 'lucide-react';

export default function PostPropertySection() {
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        property_type: '',
        deal_type: '',
        description: '',
        expected_price: '',
    });

    const supabase = createClient();

    const handleOpenForm = () => {
        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

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
        const uploadedUrls: string[] = [];
        for (const file of images) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('submission-images')
                .upload(fileName, file);
            if (uploadError) { console.error('Upload error:', uploadError); continue; }
            const { data: { publicUrl } } = supabase.storage.from('submission-images').getPublicUrl(fileName);
            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const uploadedImageUrls = await uploadImages();
            const { data: { user } } = await supabase.auth.getUser();
            const { error: insertError } = await supabase.from('property_submissions').insert([{
                user_id: user?.id || null,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                property_type: formData.deal_type === 'For Rent' ? 'Rent' : 'Sale',
                deal_type: formData.deal_type,
                property_category: formData.property_type,
                description: formData.description,
                expected_price: formData.expected_price ? parseFloat(formData.expected_price) : null,
                images: uploadedImageUrls,
                status: 'new'
            }]);
            if (insertError) throw insertError;
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Error submitting:', err);
            setError(err.message || 'Failed to submit. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--dark-turquoise)]/20 focus:border-[var(--dark-turquoise)] outline-none transition-all bg-white text-gray-900 text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
    const selectClass = `${inputClass} appearance-none cursor-pointer`;

    return (
        <section className="py-20 md:py-28" style={{ background: 'linear-gradient(180deg, var(--background) 0%, #f0f4f3 100%)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── CTA Block ── */}
                <AnimatePresence mode="wait">
                    {!showForm && !isSuccess && (
                        <motion.div
                            key="cta"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <p className="text-sm font-medium tracking-[0.2em] uppercase text-[var(--dark-turquoise)] mb-4">
                                List With Us
                            </p>
                            <h2 className="text-3xl md:text-5xl font-bold text-[var(--dark-grey)] mb-6 leading-tight"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                Want to Sell or Rent <br className="hidden md:block" />Your Property?
                            </h2>
                            <p className="text-gray-500 max-w-xl mx-auto mb-10 text-lg">
                                Submit your property details and our team will get back to you within 24 hours for verification.
                            </p>
                            <motion.button
                                onClick={handleOpenForm}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--dark-turquoise)] text-white rounded-lg font-semibold text-base hover:bg-[#1a4640] transition-colors shadow-lg shadow-[var(--dark-turquoise)]/20"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Post Your Property
                                <ArrowUpRight size={20} />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Form Block ── */}
                    {showForm && !isSuccess && (
                        <motion.div
                            key="form"
                            ref={formRef}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="text-center mb-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-[var(--dark-grey)] mb-3"
                                    style={{ fontFamily: 'var(--font-heading)' }}>
                                    Post Your Property
                                </h2>
                                <p className="text-gray-500">Fill in the details below and we&apos;ll take care of the rest.</p>
                            </div>

                            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <form onSubmit={handleSubmit}>
                                    {/* Contact Info */}
                                    <div className="p-6 md:p-8 border-b border-gray-100">
                                        <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center text-xs font-bold">1</span>
                                            Contact Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div>
                                                <label className={labelClass}>Full Name *</label>
                                                <input type="text" name="name" placeholder="John Doe" required value={formData.name} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Phone *</label>
                                                <input type="tel" name="phone" placeholder="+91 98765 43210" required value={formData.phone} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email *</label>
                                                <input type="email" name="email" placeholder="john@example.com" required value={formData.email} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property Details */}
                                    <div className="p-6 md:p-8 border-b border-gray-100">
                                        <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center text-xs font-bold">2</span>
                                            Property Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                            <div>
                                                <label className={labelClass}>Property Type *</label>
                                                <select name="property_type" required value={formData.property_type} onChange={handleInputChange} className={selectClass}>
                                                    <option value="" disabled>Select type</option>
                                                    <option value="Apartment">Apartment</option>
                                                    <option value="Villa">Villa</option>
                                                    <option value="Plot">Plot</option>
                                                    <option value="Bungalow">Bungalow</option>
                                                    <option value="Commercial">Commercial</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Deal Type *</label>
                                                <select name="deal_type" required value={formData.deal_type} onChange={handleInputChange} className={selectClass}>
                                                    <option value="" disabled>Select deal</option>
                                                    <option value="For Sale">For Sale</option>
                                                    <option value="For Rent">For Rent</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Expected Price (₹)</label>
                                                <input type="number" name="expected_price" placeholder="e.g. 5000000" value={formData.expected_price} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Description</label>
                                            <textarea name="description" placeholder="Location, size, amenities, condition..." value={formData.description} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} />
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="p-6 md:p-8 border-b border-gray-100">
                                        <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center text-xs font-bold">3</span>
                                            Images <span className="text-gray-400 font-normal text-sm">(optional)</span>
                                        </h3>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--dark-turquoise)]/40 hover:bg-[var(--dark-turquoise)]/5 transition-all"
                                        >
                                            <Upload className="mx-auto mb-2 text-gray-400" size={28} />
                                            <p className="text-gray-600 font-medium text-sm">Click to upload images</p>
                                            <p className="text-gray-400 text-xs mt-1">PNG, JPG, WEBP</p>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} multiple accept="image/*" className="hidden" />

                                        {imagePreviews.length > 0 && (
                                            <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                {imagePreviews.map((url, i) => (
                                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                                        <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="mx-6 md:mx-8 mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <div className="p-6 md:p-8 flex items-center justify-between">
                                        <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                                            ← Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3 bg-[var(--dark-turquoise)] text-white rounded-lg font-semibold hover:bg-[#1a4640] transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Submitting...</> : 'Submit Property'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Success Block ── */}
                    {isSuccess && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center py-10"
                        >
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[var(--dark-grey)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                                Thank You!
                            </h2>
                            <p className="text-gray-600 max-w-lg mx-auto mb-3 text-lg">
                                Your property has been submitted successfully. Our representative will reach out to verify your property soon.
                            </p>
                            <p className="text-gray-400 text-sm mb-8">
                                Looking to invest? Explore our curated listings.
                            </p>
                            <a
                                href="/properties"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--dark-turquoise)] text-white rounded-lg font-semibold hover:bg-[#1a4640] transition-colors"
                            >
                                Explore Properties <ArrowUpRight size={18} />
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
