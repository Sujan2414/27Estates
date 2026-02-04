'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
    MapPin, CheckCircle2, Calendar, FileText,
    Building2, Home, Share2, Phone, Mail
} from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'];

interface TowerData {
    name: string;
    completion_date: string;
}

interface ProjectPlanData {
    tower: string;
    type: string;
    bhk: number;
    area: string;
    price_rate: string;
    basic_price: string;
}

export default function ProjectDetailPage() {
    const params = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProject = async () => {
            if (!params.id) return;

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', params.id as string)
                .single();

            if (error) {
                console.error('Error fetching project:', error);
            } else {
                setProject(data);
            }
            setLoading(false);
        };

        fetchProject();
    }, [params.id, supabase]);

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
    if (!project) return <div className="h-screen flex items-center justify-center">Project not found</div>;

    const towers = (project.towers_data as unknown as TowerData[]) || [];
    const projectPlan = (project.project_plan as unknown as ProjectPlanData[]) || [];

    return (
        <main className="bg-white min-h-screen">
            <Navigation />

            {/* Hero / Images */}
            <section className="relative h-[60vh] md:h-[70vh] w-full">
                <div className="absolute inset-0">
                    <img
                        src={project.images?.[0] || '/placeholder-project.jpg'}
                        alt={project.project_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white bg-gradient-to-t from-black/80 to-transparent">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider mb-3">
                                    {project.status}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.project_name}</h1>
                                <div className="flex items-center text-gray-200 text-lg">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    {project.location || project.address}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-300 text-sm uppercase tracking-wider mb-1">Starting Price</p>
                                <p className="text-3xl font-bold text-white">
                                    {project.min_price || 'Ptice on Request'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Overview */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Highlights</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <Building2 className="w-6 h-6 text-primary mb-2" />
                                <p className="text-xs text-gray-500 uppercase">Configuration</p>
                                <p className="font-semibold">{project.bhk_options?.join(', ') || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <Home className="w-6 h-6 text-primary mb-2" />
                                <p className="text-xs text-gray-500 uppercase">Project Area</p>
                                <p className="font-semibold">{project.min_area} - {project.max_area} Sq.Ft</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <Calendar className="w-6 h-6 text-primary mb-2" />
                                <p className="text-xs text-gray-500 uppercase">Possession</p>
                                <p className="font-semibold">{project.possession_date || 'Soon'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                                <p className="text-xs text-gray-500 uppercase">RERA Status</p>
                                <p className="font-semibold">{project.is_rera_approved ? 'Approved' : 'Pending'}</p>
                            </div>
                        </div>

                        {project.description && (
                            <div className="mt-8 prose max-w-none text-gray-600">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About {project.project_name}</h3>
                                <p>{project.description}</p>
                            </div>
                        )}
                    </section>

                    {/* Towers Table */}
                    {towers.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tower Status</h2>
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-100 text-gray-900 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Tower Name</th>
                                            <th className="px-6 py-4">Completion Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {towers.map((tower, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">{tower.name}</td>
                                                <td className="px-6 py-4">{tower.completion_date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Project Plan Table */}
                    {projectPlan.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Plan</h2>
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-100 text-gray-900 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Tower</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">BHK</th>
                                            <th className="px-6 py-4">Area</th>
                                            <th className="px-6 py-4">Price / Rate</th>
                                            <th className="px-6 py-4">Basic Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {projectPlan.map((plan, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">{plan.tower}</td>
                                                <td className="px-6 py-4">{plan.type}</td>
                                                <td className="px-6 py-4">{plan.bhk}</td>
                                                <td className="px-6 py-4">{plan.area}</td>
                                                <td className="px-6 py-4">{plan.price_rate}</td>
                                                <td className="px-6 py-4 font-semibold text-gray-900">{plan.basic_price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Video / Walkthrough */}
                    {project.video_url && (
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Walkthrough</h2>
                            <div className="aspect-video rounded-2xl overflow-hidden bg-black relative group">
                                <iframe
                                    src={project.video_url.replace('watch?v=', 'embed/')}
                                    title="Project Walkthrough"
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        </section>
                    )}

                </div>

                {/* Sidebar / Contact */}
                <div className="lg:col-span-1">
                    <div className="sticky top-32 space-y-6">
                        <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4">Interested?</h3>
                            <p className="text-gray-500 mb-6">Contact our sales team for the best offers and site visit.</p>

                            <div className="space-y-4">
                                <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Call Sales
                                </button>
                                <button className="w-full bg-white text-gray-900 border border-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Request Brochure
                                </button>
                                <button className="w-full bg-white text-gray-900 border border-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share Project
                                </button>
                            </div>
                        </div>

                        {project.rera_number && (
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-2">RERA Registered</h4>
                                <p className="text-sm text-gray-500 break-all">{project.rera_number}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
