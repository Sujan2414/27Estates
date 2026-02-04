'use client';

import React, { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import PropertyCard, { PropertyProps } from '@/components/dashboard/PropertyCard';
import { motion } from 'framer-motion';

// Mock Data
const MOCK_PROPERTIES: PropertyProps[] = [
    {
        id: '1',
        title: "Modern Villa with Pool",
        description: "Stunning 4-bedroom villa located in the heart of Whitefield.",
        location: "Whitefield, Bangalore",
        price: 450000,
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
        propertyType: "Sale",
        category: "Villa",
        rooms: 4,
        bathrooms: 4,
        sqft: 3500,
        isFeatured: true
    },
    {
        id: '2',
        title: "Luxury Apartment with City View",
        description: "High-rise apartment offering breathtaking views of the city skyline.",
        location: "Indiranagar, Bangalore",
        price: 2500,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
        propertyType: "Rent",
        category: "Apartment",
        rooms: 3,
        bathrooms: 2,
        sqft: 1800,
        isFeatured: false
    },
    {
        id: '3',
        title: "Cozy Suburban Home",
        description: "Perfect family home with a large garden and quiet neighborhood.",
        location: "Yelahanka, Bangalore",
        price: 320000,
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800",
        propertyType: "Sale",
        category: "House",
        rooms: 3,
        bathrooms: 3,
        sqft: 2200,
        isFeatured: false
    },
    {
        id: '4',
        title: "Premium Office Space",
        description: "Grade A office space suitable for MNCs.",
        location: "Outer Ring Road, Bangalore",
        price: 5000,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
        propertyType: "Rent",
        category: "Commercial",
        rooms: 1,
        bathrooms: 2,
        sqft: 4000,
        isFeatured: true
    }
];

export default function DashboardPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="p-6 md:p-10 min-h-screen">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-[var(--dark-grey)] mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-500">Welcome back, Sujan 👋</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--dark-turquoise)] text-white rounded-xl font-medium shadow-lg shadow-[var(--dark-turquoise)]/20 hover:bg-[#1a4640] transition-colors">
                        <Plus size={20} />
                        <span className="hidden md:inline">Add Listing</span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer">
                        <img src="https://ui-avatars.com/api/?name=Sujan+Dandgulkar&background=1F524B&color=fff" alt="Profile" />
                    </div>
                </div>
            </header>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                <div className="lg:col-span-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <Search className="text-gray-400 ml-4" size={20} />
                    <input
                        type="text"
                        placeholder="Search properties, locations, or clients..."
                        className="flex-1 px-4 py-3 outline-none text-[var(--dark-grey)] bg-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                        <Filter size={20} />
                    </button>
                </div>

                {/* Simple Stat Card */}
                <div className="bg-[var(--dark-turquoise)] p-6 rounded-2xl text-white shadow-lg shadow-[var(--dark-turquoise)]/20">
                    <p className="text-white/70 text-sm font-medium mb-1">Total Properties</p>
                    <div className="text-3xl font-bold">{MOCK_PROPERTIES.length}</div>
                </div>
            </div>

            {/* Featured Section */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[var(--dark-grey)] uppercase tracking-wide">Featured Listings</h2>
                    <button className="text-[var(--dark-turquoise)] text-sm font-bold hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {MOCK_PROPERTIES.filter(p => p.isFeatured).map((property, idx) => (
                        <motion.div
                            key={property.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <PropertyCard property={property} />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* All Listings Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[var(--dark-grey)] uppercase tracking-wide">Recent Properties</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {MOCK_PROPERTIES.filter(p => !p.isFeatured).map((property, idx) => (
                        <motion.div
                            key={property.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                        >
                            <PropertyCard property={property} />
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}
