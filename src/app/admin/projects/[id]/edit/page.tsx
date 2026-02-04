'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import Sidebar from '@/components/emergent/Sidebar';

type Project = Database['public']['Tables']['projects']['Row'];

export default function AdminProjectEdit() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // JSON State
    const [towersJson, setTowersJson] = useState('[]');
    const [planJson, setPlanJson] = useState('[]');

    useEffect(() => {
        const fetchProject = async () => {
            if (!params.id) return;
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', params.id as string)
                .single();

            if (error) {
                console.error('Error:', error);
            } else {
                setProject(data);
                setTowersJson(JSON.stringify(data.towers_data || [], null, 2));
                setPlanJson(JSON.stringify(data.project_plan || [], null, 2));
            }
            setLoading(false);
        };
        fetchProject();
    }, [params.id, supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;
        setSaving(true);

        try {
            // Parse JSONs
            const towersData = JSON.parse(towersJson);
            const planData = JSON.parse(planJson);

            const { error } = await supabase
                .from('projects')
                .update({
                    project_name: project.project_name,
                    min_price: project.min_price,
                    status: project.status,
                    location: project.location,
                    // Update JSONB columns
                    towers_data: towersData,
                    project_plan: planData,
                })
                .eq('id', project.id);

            if (error) throw error;
            alert('Project saved!');
        } catch (err: any) {
            alert('Error saving: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!project) return <div className="p-8">Project not found</div>;

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <h1 className="text-2xl font-bold mb-6">Edit Project: {project.project_name}</h1>

                <form onSubmit={handleSave} className="max-w-3xl space-y-6 bg-white p-6 rounded-xl shadow-sm">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Project Name</label>
                            <input
                                type="text"
                                value={project.project_name}
                                onChange={(e) => setProject({ ...project, project_name: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <input
                                type="text"
                                value={project.status}
                                onChange={(e) => setProject({ ...project, status: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Values (Min Price)</label>
                            <input
                                type="text"
                                value={project.min_price || ''}
                                onChange={(e) => setProject({ ...project, min_price: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Towers Data (JSON - Array of {`{ name, completion_date }`})
                        </label>
                        <textarea
                            value={towersJson}
                            onChange={(e) => setTowersJson(e.target.value)}
                            className="w-full h-32 p-2 border rounded font-mono text-xs bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Project Plan (JSON - Array of {`{ tower, type, bhk, area, price_rate, basic_price }`})
                        </label>
                        <textarea
                            value={planJson}
                            onChange={(e) => setPlanJson(e.target.value)}
                            className="w-full h-48 p-2 border rounded font-mono text-xs bg-gray-50"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
