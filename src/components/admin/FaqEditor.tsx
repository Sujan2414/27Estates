'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Faq = { question: string; answer: string };

type Props = {
    table: 'projects' | 'properties';
    rowId: string;
    rowName: string;
    backHref: string;
};

export default function FaqEditor({ table, rowId, rowName, backHref }: Props) {
    const supabase = createClient();
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const { data, error: e } = await supabase
                .from(table)
                .select('faqs')
                .eq('id', rowId)
                .single();
            if (cancelled) return;
            if (e) {
                setError(e.message);
            } else if (Array.isArray(data?.faqs)) {
                const valid = (data.faqs as unknown[]).filter(
                    (f): f is Faq =>
                        typeof f === 'object' && f !== null &&
                        typeof (f as Faq).question === 'string' &&
                        typeof (f as Faq).answer === 'string',
                );
                setFaqs(valid);
            } else {
                setFaqs([]);
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [supabase, table, rowId]);

    const updateFaq = (i: number, field: keyof Faq, value: string) => {
        setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
    };

    const addFaq = () => setFaqs((prev) => [...prev, { question: '', answer: '' }]);
    const removeFaq = (i: number) => setFaqs((prev) => prev.filter((_, idx) => idx !== i));
    const moveUp = (i: number) => {
        if (i === 0) return;
        setFaqs((prev) => {
            const next = [...prev];
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        // Trim and drop empties before saving
        const cleaned = faqs
            .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
            .filter((f) => f.question.length > 0 && f.answer.length > 0);
        const payload = cleaned.length > 0 ? cleaned : null;
        const { error: e } = await supabase
            .from(table)
            .update({ faqs: payload })
            .eq('id', rowId);
        if (e) {
            setError(e.message);
        } else {
            setSavedAt(new Date());
            // Reflect cleaned state in UI
            setFaqs(cleaned);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={18} className="animate-spin" /> Loading FAQs…
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 900 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <a href={backHref} style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Back</a>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0.5rem 0' }}>
                    Edit FAQs — {rowName}
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: 640 }}>
                    These FAQs render as <code>FAQPage</code> JSON-LD on the public detail page. When set, they replace the auto-generated FAQs entirely. Leaving the list empty falls back to auto-generation.
                </p>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {faqs.map((f, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>FAQ #{i + 1}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => moveUp(i)}
                                    disabled={i === 0}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.5 : 1 }}
                                >
                                    ↑ Move up
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeFaq(i)}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                    <Trash2 size={12} /> Remove
                                </button>
                            </div>
                        </div>
                        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                                Question
                            </span>
                            <input
                                value={f.question}
                                onChange={(e) => updateFaq(i, 'question', e.target.value)}
                                placeholder="e.g. What is the price of {project name}?"
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem' }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                                Answer
                            </span>
                            <textarea
                                value={f.answer}
                                onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                                placeholder="Concise factual answer (2–4 sentences)."
                                rows={3}
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </label>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
                <button
                    type="button"
                    onClick={addFaq}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                    <Plus size={16} /> Add FAQ
                </button>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', background: '#183C38', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.9375rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {saving ? 'Saving…' : 'Save FAQs'}
                </button>
                {savedAt && !saving && (
                    <span style={{ fontSize: '0.875rem', color: '#16a34a' }}>
                        Saved {savedAt.toLocaleTimeString()}
                    </span>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: 6, fontSize: '0.8125rem', color: '#4b5563' }}>
                <strong>SEO tips for high-impact FAQs:</strong>
                <ul style={{ marginTop: 8, paddingLeft: '1.25rem' }}>
                    <li>Phrase questions exactly as a buyer would search them in Google.</li>
                    <li>Lead each answer with the most direct, factual statement (Google extracts that for snippets).</li>
                    <li>Include specific numbers (price, sqft, RERA #, possession date) where possible.</li>
                    <li>3–6 FAQs per project tends to win the most snippets without diluting.</li>
                </ul>
            </div>
        </div>
    );
}
