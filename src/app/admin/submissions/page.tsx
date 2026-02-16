'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, Phone, MapPin, Home, DollarSign, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface Submission {
    id: string;
    name: string;
    email: string;
    phone: string;
    property_type: string;
    deal_type: string;
    description: string;
    expected_price: number;
    city: string;
    images: string[];
    status: string;
    created_at: string;
}

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('property_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching submissions:', error);
        } else {
            setSubmissions(data || []);
        }
        setIsLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('property_submissions')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: newStatus } : sub));
        }
    };

    const deleteSubmission = async (id: string) => {
        if (!confirm('Are you sure you want to delete this submission?')) return;

        const { error } = await supabase
            .from('property_submissions')
            .delete()
            .eq('id', id);

        if (!error) {
            setSubmissions(prev => prev.filter(sub => sub.id !== id));
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 h-8 text-gray-500" /></div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Property Submissions</h1>

            <div className="grid gap-6">
                {submissions.map((sub) => (
                    <div key={sub.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                        {/* Image Preview */}
                        <div className="w-full md:w-64 h-48 md:h-auto relative bg-gray-100 flex-shrink-0">
                            {sub.images && sub.images.length > 0 ? (
                                <Image
                                    src={sub.images[0]}
                                    alt="Property"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <Home size={32} />
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {sub.status.toUpperCase()}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900">{sub.deal_type} - {sub.property_type}</h3>
                                    <span className="text-sm text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900">{sub.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={16} />
                                        {sub.expected_price ? `₹${sub.expected_price.toLocaleString()}` : 'Price not set'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} />
                                        <a href={`mailto:${sub.email}`} className="hover:underline">{sub.email}</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} />
                                        <a href={`tel:${sub.phone}`} className="hover:underline">{sub.phone}</a>
                                    </div>
                                </div>

                                <p className="text-gray-700 text-sm mb-4 line-clamp-3 md:line-clamp-none">
                                    {sub.description}
                                </p>

                                {sub.images && sub.images.length > 1 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                        {sub.images.slice(1).map((img, idx) => (
                                            <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                                                <Image src={img} alt={`Extra ${idx}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {sub.status === 'new' && (
                                    <button
                                        onClick={() => updateStatus(sub.id, 'contacted')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium"
                                    >
                                        <CheckCircle size={14} /> Mark Contacted
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteSubmission(sub.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-medium ml-auto"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {submissions.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No submissions yet.
                    </div>
                )}
            </div>
        </div>
    );
}
