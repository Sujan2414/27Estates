import React from 'react';
import PostPropertyForm from '@/components/dashboard/PostPropertyForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Post Your Property | 21 Estates',
    description: 'Submit your property for sale or rent with 21 Estates.',
};

export default function PostPropertyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <PostPropertyForm />
            </div>
        </div>
    );
}
