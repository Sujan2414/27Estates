'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FaqEditor from '@/components/admin/FaqEditor';

type Props = { params: Promise<{ id: string }> };

export default function ProjectFaqsAdminPage({ params }: Props) {
    const { id } = use(params);
    const supabase = createClient();
    const [name, setName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data, error: e } = await supabase
                .from('projects')
                .select('project_name')
                .eq('id', id)
                .single();
            if (cancelled) return;
            if (e) setError(e.message);
            else setName((data?.project_name as string) ?? 'Untitled project');
        })();
        return () => { cancelled = true; };
    }, [supabase, id]);

    if (error) {
        return <div style={{ padding: '2rem', color: '#991b1b' }}>Error loading project: {error}</div>;
    }
    if (!name) {
        return <div style={{ padding: '2rem' }}>Loading…</div>;
    }

    return (
        <FaqEditor
            table="projects"
            rowId={id}
            rowName={name}
            backHref="/admin/projects"
        />
    );
}
