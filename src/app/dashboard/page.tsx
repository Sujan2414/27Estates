'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import PropertyCard, { PropertyProps } from '@/components/dashboard/PropertyCard';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';



export default function DashboardPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();
    const supabase = createClient();

    const [properties, setProperties] = useState<PropertyProps[]>([]);
    const [featuredProperties, setFeaturedProperties] = useState<PropertyProps[]>([]);
    const [recentProperties, setRecentProperties] = useState<PropertyProps[]>([]);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileName, setProfileName] = useState<string | null>(null);

    // Fetch profile name with robust fallbacks
    useEffect(() => {
        if (!user) { setProfileName(null); return; }

        const fetchProfile = async () => {
            // 1) Try profiles table
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('first_name, full_name')
                    .eq('id', user.id)
                    .single();
                if (data?.first_name) { setProfileName(data.first_name); return; }
                if (data?.full_name) { setProfileName(data.full_name.split(' ')[0]); return; }
            } catch { /* continue */ }

            // 2) Fresh metadata via getUser()
            try {
                const { data: { user: freshUser } } = await supabase.auth.getUser();
                const meta = freshUser?.user_metadata;
                if (meta?.first_name) { setProfileName(String(meta.first_name)); return; }
                if (meta?.full_name) { setProfileName(String(meta.full_name).split(' ')[0]); return; }
                if (meta?.name) { setProfileName(String(meta.name).split(' ')[0]); return; }
            } catch { /* continue */ }

            // 3) Session metadata
            const meta = user.user_metadata;
            if (meta?.first_name) { setProfileName(String(meta.first_name)); }
            else if (meta?.full_name) { setProfileName(String(meta.full_name).split(' ')[0]); }
            else if (user.email) { setProfileName(user.email.split('@')[0]); }
            else { setProfileName(null); }
        };
        fetchProfile();
    }, [user?.id]);

    // Get display name
    const firstName = profileName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Guest';
    const fullName = user?.user_metadata?.full_name || firstName;

    const fetchPropertiesAndBookmarks = async () => {
        try {
            setLoading(true);

            // 1. Fetch Properties
            const { data: propsData, error: propsError } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (propsError) throw propsError;

            // Map database columns to PropertyProps interface
            const mappedProperties: PropertyProps[] = (propsData || []).map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description || '',
                location: p.location,
                price: p.price,
                image: p.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800', // Fallback image
                propertyType: p.property_type,
                category: p.category,
                rooms: p.bedrooms || 0, // Mapping bedrooms to rooms for card display
                bathrooms: p.bathrooms || 0,
                sqft: p.sqft || 0,
                isFeatured: p.is_featured
            }));

            setProperties(mappedProperties);
            setFeaturedProperties(mappedProperties.filter(p => p.isFeatured));
            setRecentProperties(mappedProperties.filter(p => !p.isFeatured));

            // 2. Fetch User Bookmarks if logged in
            if (user) {
                const { data: bookmarkData, error: bookmarkError } = await supabase
                    .from('user_bookmarks')
                    .select('property_id')
                    .eq('user_id', user.id);

                if (bookmarkError) throw bookmarkError;

                setBookmarkIds(bookmarkData.map((b: any) => b.property_id));
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPropertiesAndBookmarks();
    }, [user]);

    const handleToggleBookmark = async (propertyId: string) => {
        if (!user) return;

        const isCurrentlyBookmarked = bookmarkIds.includes(propertyId);
        let newBookmarks = [...bookmarkIds];

        // Optimistically update UI
        if (isCurrentlyBookmarked) {
            newBookmarks = newBookmarks.filter(id => id !== propertyId);
        } else {
            newBookmarks.push(propertyId);
        }
        setBookmarkIds(newBookmarks);

        try {
            if (isCurrentlyBookmarked) {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('property_id', propertyId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .insert({
                        user_id: user.id,
                        property_id: propertyId
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            // Revert changes on error
            setBookmarkIds(bookmarkIds);
        }
    };

    return (
        <div className="p-6 md:p-10 min-h-screen">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-[var(--dark-grey)] mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-500">Welcome back, {firstName} 👋</p>
                </div>



                <div className="flex items-center gap-4">
                    <Link href="/dashboard/post-property" className="flex items-center gap-2 px-5 py-2.5 bg-[var(--dark-turquoise)] text-white rounded-[4px] font-medium hover:bg-[#1a4640] transition-colors">
                        <Plus size={20} />
                        <span className="hidden md:inline">Add Listing</span>
                    </Link>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1F524B&color=fff`}
                            alt="Profile"
                        />
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
                    <div className="text-3xl font-bold">{properties.length}</div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dark-turquoise)]"></div>
                </div>
            ) : (
                <>
                    {/* Featured Section */}
                    {featuredProperties.length > 0 && (
                        <section className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[var(--dark-grey)] uppercase tracking-wide">Featured Listings</h2>
                                <button className="text-[var(--dark-turquoise)] text-sm font-bold hover:underline">View All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {featuredProperties.map((property, idx) => (
                                    <motion.div
                                        key={property.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <PropertyCard
                                            property={property}
                                            isBookmarked={bookmarkIds.includes(property.id)}
                                            onToggleBookmark={handleToggleBookmark}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All Listings Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[var(--dark-grey)] uppercase tracking-wide">Recent Properties</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {recentProperties.map((property, idx) => (
                                <motion.div
                                    key={property.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                >
                                    <PropertyCard
                                        property={property}
                                        isBookmarked={bookmarkIds.includes(property.id)}
                                        onToggleBookmark={handleToggleBookmark}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
