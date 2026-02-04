'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import ProjectCard from '@/components/emergent/ProjectCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Search, SlidersHorizontal } from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'];

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [supabase]);

    return (
        <main className="min-h-screen bg-gray-50">
            <Navigation />

            {/* Search Header */}
            <div className="bg-white border-b pt-32 pb-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">New Projects</h1>
                            <p className="text-gray-500 mt-1">Discover premium developments across Bangalore</p>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    className="pl-10 pr-4 py-2 border rounded-full text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <button
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5"
                                style={{
                                    backgroundColor: '#1F524B',
                                    color: '#ffffff',
                                    border: '1px solid #1F524B',
                                    letterSpacing: '0.08em'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2d7a6e';
                                    e.currentTarget.style.borderColor = '#2d7a6e';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(31, 82, 75, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1F524B';
                                    e.currentTarget.style.borderColor = '#1F524B';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                id={project.id}
                                project_name={project.project_name}
                                location={project.location || project.city || ''}
                                min_price={project.min_price}
                                max_price={project.max_price}
                                bhk_options={project.bhk_options}
                                image={project.images?.[0] || ''}
                                status={project.status || 'Upcoming'}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-medium text-gray-900">No projects found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
