'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Home as HomeIcon, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const HomeSearch = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'properties' | 'projects'>('properties');
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const base = activeTab === 'properties' ? '/properties' : '/projects';
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (location) params.set('location', location);

        router.push(`${base}?${params.toString()}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="w-full max-w-4xl mx-auto px-4 relative z-20 -mt-24 md:-mt-32"
        >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('properties')}
                        className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'properties'
                            ? 'bg-white text-[var(--dark-turquoise)] border-b-2 border-[var(--dark-turquoise)]'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <HomeIcon className="w-4 h-4" />
                        Buy Properties
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'projects'
                            ? 'bg-white text-[var(--dark-turquoise)] border-b-2 border-[var(--dark-turquoise)]'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        New Projects
                    </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="p-6 md:p-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                            Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="e.g. Whitefield, Hebbal"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--dark-turquoise)]/20 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-[1.5] relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                            Keyword
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={activeTab === 'properties' ? "Search for villas, apartments..." : "Search project name..."}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--dark-turquoise)]/20 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            Search
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default HomeSearch;
