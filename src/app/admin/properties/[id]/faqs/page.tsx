'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FaqEditor from '@/components/admin/FaqEditor';

type Props = { params: Promise<{ id: string }> };

export default function PropertyFaqsAdminPage({ params }: Props) {
    const { id } = use(params);
    const supabase = createClient();
    const [name, setName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data, error: e } = await supabase
                .from('properties')
                .select('title')
                .eq('id', id)
                .single();
            if (cancelled) return;
            if (e) setError(e.message);
            else setName((data?.title as string) ?? 'Untitled property');
        })();
        return () => { cancelled = true; };
    }, [supabase, id]);

    if (error) {
        return <div style={{ padding: '2rem', color: '#991b1b' }}>Error loading property: {error}</div>;
    }
    if (!name) {
        return <div style={{ padding: '2rem' }}>Loading…</div>;
    }

    return (
        <FaqEditor
            table="properties"
            rowId={id}
            rowName={name}
            backHref="/admin/properties"
        />
    );
}
