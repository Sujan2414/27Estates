'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { canonicalCity, dedupeCities } from '@/lib/cities';

type Props = {
    value: string;
    onChange: (city: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    name?: string;
};

// Search-as-you-type combobox for city selection.
//
// On mount, fetches DISTINCT non-null cities from projects + properties tables
// (deduped via canonicalCity so Bangalore/Bengaluru/blr collapse to one
// "Bangalore" entry). The input is editable: typing both filters the dropdown
// AND captures a "new city" candidate that becomes available via the
// "+ Add ..." pill at the bottom of the list. Confirming a new city pushes
// it into the local list so it shows immediately without a refresh; persistence
// happens automatically when the form saves the row.
export default function CitySelect({
    value,
    onChange,
    className,
    placeholder = 'Type or pick a city',
    required = false,
    name = 'city',
}: Props) {
    const supabase = useMemo(() => createClient(), []);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    // `query` is what's currently in the input. When the dropdown is closed
    // we display the saved `value` instead (so the user sees the selected
    // city when not actively searching).
    const [query, setQuery] = useState('');
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

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
            ];
            const sorted = dedupeCities(all).sort((a, b) => a.localeCompare(b));
            setCities(sorted);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [supabase]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return cities;
        return cities.filter((c) => c.toLowerCase().includes(q));
    }, [cities, query]);

    // Whether the current query matches an existing canonical entry. If not
    // and the query is non-empty, the "Add this as a new city" affordance shows.
    const queryMatchesExisting = useMemo(() => {
        const q = query.trim();
        if (!q) return true;
        const canonical = canonicalCity(q).toLowerCase();
        return cities.some((c) => c.toLowerCase() === canonical);
    }, [cities, query]);

    const selectCity = (c: string) => {
        onChange(c);
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
    };

    const confirmNewCity = () => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const canonical = canonicalCity(trimmed);
        const existingMatch = cities.find((c) => c.toLowerCase() === canonical.toLowerCase());
        if (existingMatch) {
            selectCity(existingMatch);
            return;
        }
        // Push into local list so it shows immediately. The row save will
        // persist it to the database; next dropdown load picks it up via the
        // DISTINCT query.
        setCities((prev) => [...prev, canonical].sort((a, b) => a.localeCompare(b)));
        selectCity(canonical);
    };

    // Show the live query while typing; otherwise the saved value
    const displayValue = open ? query : value;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setQuery('');
            inputRef.current?.blur();
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            // Pick the first match if there is one; otherwise treat as new
            if (filtered.length > 0) {
                selectCity(filtered[0]);
            } else if (query.trim()) {
                confirmNewCity();
            }
        }
    };

    return (
        <div ref={wrapRef} style={{ position: 'relative', width: '100%' }} className={className}>
            <input type="hidden" name={name} value={value} required={required} />

            <div style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!open) setOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    style={{
                        width: '100%',
                        padding: '0.5rem 2.25rem 0.5rem 0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        background: '#fff',
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        color: '#111827',
                    }}
                />
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {value && !open && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            title="Clear"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        size={16}
                        style={{ color: '#6b7280', cursor: 'pointer' }}
                        onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
                    />
                </div>
            </div>

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
                        maxHeight: 280,
                        overflowY: 'auto',
                    }}
                >
                    {loading ? (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#9ca3af' }}>Loading cities…</div>
                    ) : filtered.length > 0 ? (
                        filtered.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); selectCity(c); }}
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
                    ) : (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                            No matching cities.
                        </div>
                    )}

                    {query.trim() && !queryMatchesExisting && (
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); confirmNewCity(); }}
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
                            <Plus size={14} /> Add &ldquo;{canonicalCity(query.trim())}&rdquo; as a new city
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
