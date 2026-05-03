'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Props = {
    value: string;
    onChange: (city: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    name?: string;
};

// Fetches DISTINCT non-empty cities from projects + properties tables and
// presents them as a searchable dropdown. Admins can also type a new city
// (the "Add new" option). New cities flow into the next dropdown load
// because they get persisted on the row that's being saved.
//
// This eliminates the Bangalore-vs-Bengaluru typo class of bugs going
// forward — admins pick from the actual list of cities already in use.
//
// Existing inconsistent data is NOT auto-normalised by this component. To
// canonicalise old rows (e.g., merge "Bengaluru" into "Bangalore"), run a
// one-off SQL update in Supabase.
export default function CitySelect({
    value,
    onChange,
    className,
    placeholder = 'Select or add a city',
    required = false,
    name = 'city',
}: Props) {
    const supabase = useMemo(() => createClient(), []);
    const [open, setOpen] = useState(false);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [addingNew, setAddingNew] = useState(false);
    const [newCity, setNewCity] = useState('');
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [{ data: pj }, { data: pr }] = await Promise.all([
                supabase.from('projects').select('city').not('city', 'is', null),
                supabase.from('properties').select('city').not('city', 'is', null),
            ]);
            if (cancelled) return;
            const all = [
                ...((pj ?? []).map((r: { city: string | null }) => r.city)),
                ...((pr ?? []).map((r: { city: string | null }) => r.city)),
            ]
                .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
                .map((c) => c.trim());
            // Dedupe case-insensitively, prefer first-seen casing
            const seen = new Map<string, string>();
            for (const c of all) {
                const key = c.toLowerCase();
                if (!seen.has(key)) seen.set(key, c);
            }
            const sorted = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
            setCities(sorted);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [supabase]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
                setAddingNew(false);
                setNewCity('');
                setSearch('');
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return cities;
        return cities.filter((c) => c.toLowerCase().includes(q));
    }, [cities, search]);

    const selectCity = (c: string) => {
        onChange(c);
        setOpen(false);
        setSearch('');
        setAddingNew(false);
        setNewCity('');
    };

    const confirmNewCity = () => {
        const trimmed = newCity.trim();
        if (!trimmed) return;
        // Reuse existing casing if a case-insensitive match exists
        const existingMatch = cities.find((c) => c.toLowerCase() === trimmed.toLowerCase());
        const finalValue = existingMatch ?? trimmed;
        // Push into local list so it shows in this session before refresh
        if (!existingMatch) {
            setCities((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
        }
        selectCity(finalValue);
    };

    return (
        <div ref={wrapRef} style={{ position: 'relative', width: '100%' }} className={className}>
            {/* Hidden input keeps form-data submission compatible (e.g. FormData with field 'city') */}
            <input type="hidden" name={name} value={value} required={required} />

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    background: '#fff',
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    color: value ? '#111827' : '#9ca3af',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                }}
            >
                <span>{value || placeholder}</span>
                <ChevronDown size={16} style={{ flexShrink: 0, color: '#6b7280' }} />
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        zIndex: 20,
                        maxHeight: 320,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {!addingNew && (
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Search size={14} style={{ color: '#9ca3af', flexShrink: 0, marginLeft: 4 }} />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search cities…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', padding: '0.25rem' }}
                            />
                        </div>
                    )}

                    {addingNew ? (
                        <div style={{ padding: '0.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                                Add a new city
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); confirmNewCity(); }
                                    if (e.key === 'Escape') { setAddingNew(false); setNewCity(''); }
                                }}
                                placeholder="e.g. Mysore"
                                style={{ width: '100%', padding: '0.4rem 0.625rem', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: '0.875rem' }}
                            />
                            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={confirmNewCity}
                                    disabled={!newCity.trim()}
                                    style={{ padding: '0.375rem 0.75rem', background: '#183C38', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.8125rem', cursor: newCity.trim() ? 'pointer' : 'not-allowed', opacity: newCity.trim() ? 1 : 0.5 }}
                                >
                                    Add &amp; Select
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAddingNew(false); setNewCity(''); }}
                                    style={{ padding: '0.375rem 0.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 4, fontSize: '0.8125rem', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>
                                Tip: if the city already exists with different casing, it will reuse the existing entry to keep data consistent.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {loading ? (
                                <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#9ca3af' }}>Loading cities…</div>
                            ) : filtered.length === 0 ? (
                                <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                    No matching cities. Use &ldquo;Add new&rdquo; below.
                                </div>
                            ) : (
                                filtered.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => selectCity(c)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.5rem 0.875rem',
                                            border: 'none',
                                            background: c === value ? '#f3f4f6' : '#fff',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            color: '#111827',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = c === value ? '#f3f4f6' : '#fff')}
                                    >
                                        <span>{c}</span>
                                        {c === value && <span style={{ fontSize: '0.6875rem', color: '#16a34a' }}>Selected</span>}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {!addingNew && (
                        <button
                            type="button"
                            onClick={() => setAddingNew(true)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '0.625rem 0.875rem',
                                borderTop: '1px solid #f3f4f6',
                                background: '#fafafa',
                                border: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#183C38',
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={14} /> Add a new city
                        </button>
                    )}
                </div>
            )}

            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    title="Clear"
                    style={{
                        position: 'absolute',
                        right: 32,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: 2,
                    }}
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
