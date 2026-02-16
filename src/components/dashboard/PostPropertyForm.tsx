'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function PostPropertyForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        property_type: '',
        deal_type: '',
        description: '',
        expected_price: '',
        city: ''
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

            // Create preview URLs
            const newUrls = newFiles.map(file => URL.createObjectURL(file));
            setImageUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageUrls(prev => {
            // Revoke the URL to avoid memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        const bucket = 'submission-images';

        for (const file of images) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Upload Images
            const uploadedImageUrls = await uploadImages();

            // 2. Get User (optional)
            const { data: { user } } = await supabase.auth.getUser();

            // 3. Insert into Supabase
            const { error: insertError } = await supabase
                .from('property_submissions')
                .insert([
                    {
                        user_id: user?.id || null,
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        property_type: formData.deal_type === 'For Rent' ? 'Rent' : 'Sale', // Mapping to DB constraints
                        deal_type: formData.deal_type,
                        property_category: formData.property_type, // Mapping UI "Property Type" to DB "property_category" (Apartment, etc.)
                        description: formData.description,
                        expected_price: formData.expected_price ? parseFloat(formData.expected_price) : null,
                        images: uploadedImageUrls,
                        status: 'new'
                    }
                ]);

            if (insertError) throw insertError;

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Error submitting property:', err);
            setError(err.message || 'Failed to submit property. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden min-h-[600px] flex items-center justify-center p-8 text-center"
            >
                <div className="space-y-6">
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">THANK YOU</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Thank You For Posting Your Property Our Representative Will Reach out to You to Verify Your Property Soon
                    </p>
                    <p className="text-gray-500 text-lg font-medium">
                        if you're looking to invest look at some of our properties
                    </p>
                    <div className="pt-4">
                        <a
                            href="/properties"
                            className="inline-block bg-[var(--brand-red)] text-white font-bold py-3 px-8 rounded-md hover:bg-red-700 transition duration-300 uppercase tracking-wide"
                            style={{ backgroundColor: '#DC2626' }} // Explicit red from design
                        >
                            Explore Our Properties
                        </a>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">
            {/* Left Side: Form */}
            <div className="w-full md:w-1/2 p-8 md:p-12">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        Post Your Property
                        <span className="text-red-500 transform -rotate-45 inline-block">→</span>
                    </h2>
                    <div className="h-1 w-20 bg-red-500 mt-2"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter Name*"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none placeholder-gray-500 transition-colors bg-white text-gray-900"
                        />
                    </div>

                    {/* Number */}
                    <div>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Enter Number*"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none placeholder-gray-500 transition-colors bg-white text-gray-900"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email*"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none placeholder-gray-500 transition-colors bg-white text-gray-900"
                        />
                    </div>

                    {/* Property Type Dropdown */}
                    <div className="relative">
                        <select
                            name="property_type"
                            required
                            value={formData.property_type}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none text-gray-900 bg-white appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Property type*</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Villa">Villa</option>
                            <option value="Plot">Plot</option>
                            <option value="Bungalow">Bungalow</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Deal Type Dropdown */}
                    <div className="relative">
                        <select
                            name="deal_type"
                            required
                            value={formData.deal_type}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none text-gray-900 bg-white appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Deal type</option>
                            <option value="For Sale">For Sale</option>
                            <option value="For Rent">For Rent</option>
                        </select>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div>
                        <input
                            type="text"
                            name="description"
                            placeholder="Enter Property details"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none placeholder-gray-500 transition-colors bg-white text-gray-900"
                        />
                    </div>

                    {/* Expected Price */}
                    <div>
                        <input
                            type="number"
                            name="expected_price"
                            placeholder="Enter expected Rental / Sale Price"
                            value={formData.expected_price}
                            onChange={handleInputChange}
                            className="w-full py-2 px-0 border-b border-gray-300 focus:border-gray-800 focus:outline-none placeholder-gray-500 transition-colors bg-white text-gray-900"
                        />
                    </div>

                    {/* Images Upload */}
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">Images</label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm transition-colors"
                            >
                                Choose Files
                            </button>
                            <span className="text-gray-500 text-sm">
                                {images.length > 0 ? `${images.length} file(s) chosen` : 'No file chosen'}
                            </span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            multiple
                            accept="image/*"
                            className="hidden"
                        />

                        {/* Image Previews */}
                        {imageUrls.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image
                                            src={url}
                                            fill
                                            alt={`Preview ${index}`}
                                            className="object-cover rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[var(--brand-red)] w-32 text-white font-bold py-3 px-6 hover:bg-red-700 transition duration-300 uppercase tracking-wide flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#DC2626' }}
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'SUBMIT'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Side: Image */}
            <div className="w-full md:w-1/2 relative min-h-[400px] md:min-h-full">
                <div className="absolute inset-0 bg-gray-900">
                    <Image
                        src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                        alt="Real Estate"
                        fill
                        className="object-cover opacity-80"
                    />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        {/* Map Pin Icon Effect matching the design roughly */}
                        <div className="bg-white p-2 rounded-full shadow-lg">
                            <div className="bg-red-600 text-white p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a10 10 0 1 1 20 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
