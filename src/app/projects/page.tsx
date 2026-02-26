'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import ProjectCard from '@/components/emergent/ProjectCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Search, SlidersHorizontal, Building2 } from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'];

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    const fetchBookmarks = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
            const { data: bookmarkData } = await supabase
                .from('user_bookmarks')
                .select('project_id')
                .eq('user_id', authUser.id)
                .not('project_id', 'is', null);

            if (bookmarkData) {
                setBookmarks(bookmarkData.map(b => b.project_id as string));
            }
        } else {
            // Load guest bookmarks
            const guestBookmarks = JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]');
            setBookmarks(guestBookmarks);
        }
    };

    const fetchProjects = async () => {
        try {
            const { data: allProjects, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(allProjects || []);
            setFilteredProjects(allProjects || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchBookmarks();
    }, []);

    // Filter effect...
    useEffect(() => {
        let result = projects;

        if (searchQuery.toLowerCase().trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.project_name.toLowerCase().includes(query) ||
                (p.location && p.location.toLowerCase().includes(query)) // Added null check for location
            );
        }

        if (activeFilter !== 'All') {
            if (activeFilter === 'Residential') {
                result = result.filter(p => p.category === 'Residential');
            } else if (activeFilter === 'Commercial') {
                result = result.filter(p => p.category === 'Commercial');
            } else if (activeFilter === 'Plots') {
                result = result.filter(p => p.category === 'Plots');
            }
        }

        setFilteredProjects(result);
    }, [searchQuery, activeFilter, projects]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navigation />

            <main className="flex-grow container mx-auto px-4 py-8 mt-20">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">Our Projects</h1>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none w-full sm:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                            {['All', 'Residential', 'Commercial'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeFilter === filter
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                id={project.id}
                                project_name={project.project_name}
                                location={project.location || project.city || ''}
                                min_price={project.min_price}
                                max_price={project.max_price}
                                bhk_options={project.bhk_options}
                                image={project.images?.[0] || '/placeholder-project.jpg'}
                                status={project.status || 'Upcoming'}
                                developer_name={project.developer_name}
                                is_rera_approved={project.is_rera_approved}
                                category={project.category}
                                isBookmarked={bookmarks.includes(project.id)}
                                onBookmarkChange={fetchBookmarks}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Building2 size={48} className="mb-4 opacity-20" />
                        <p className="text-xl font-medium">No projects found matching your criteria</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                            className="mt-4 text-emerald-600 hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
