'use client';

import { useState } from 'react';
import { Loader2, MapPin, Check, AlertCircle } from 'lucide-react';

type PincodeLookup = {
    city: string;
    state: string;
    district: string;
    area: string;
    country: string;
};

type Props = {
    value: string;
    onChange: (pincode: string) => void;
    onLookup?: (data: PincodeLookup) => void;
    name?: string;
    className?: string;
    placeholder?: string;
};

// PIN code → address auto-fill for India.
//
// Calls the public postalpincode.in API (free, no auth, India-only). When
// admin types a 6-digit pincode and tabs out (or hits the lookup button),
// the parent receives a callback with city / state / district / area
// pre-filled. Admin can then edit any of those fields.
//
// API docs: https://www.postalpincode.in/Api-Details
// Returns Status="Success" + PostOffice[] on hit, "Error" otherwise.
export default function PincodeInput({
    value,
    onChange,
    onLookup,
    name = 'pincode',
    className,
    placeholder = '6-digit PIN code',
}: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'not_found' | 'error'>('idle');
    const [hint, setHint] = useState<string | null>(null);

    const lookup = async (pin: string) => {
        if (!/^\d{6}$/.test(pin)) {
            setStatus('idle');
            setHint(null);
            return;
        }
        setLoading(true);
        setStatus('idle');
        setHint(null);
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { cache: 'force-cache' });
            const data = (await res.json()) as Array<{
                Status: string;
                PostOffice?: Array<{
                    Name: string;
                    BranchType: string;
                    DeliveryStatus: string;
                    District: string;
                    State: string;
                    Country: string;
                }>;
            }>;
            const entry = data?.[0];
            if (!entry || entry.Status !== 'Success' || !entry.PostOffice?.length) {
                setStatus('not_found');
                setHint('PIN not found. Fill the city / state manually.');
                return;
            }
            // Pick the first delivery post office (most representative)
            const po = entry.PostOffice.find((p) => p.DeliveryStatus === 'Delivery') ?? entry.PostOffice[0];
            const result: PincodeLookup = {
                city: po.District,        // For Indian addresses, District ~= City for our purposes
                state: po.State,
                district: po.District,
                area: po.Name,            // The post office name is usually the locality (e.g. "Whitefield S.O.")
                country: po.Country || 'India',
            };
            setStatus('ok');
            setHint(`${po.Name}, ${po.District}, ${po.State}`);
            onLookup?.(result);
        } catch {
            setStatus('error');
            setHint('Lookup failed. Fill the address manually.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={className} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 6 }}>
                <input
                    type="text"
                    name={name}
                    value={value}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={placeholder}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                        onChange(v);
                        if (v.length < 6) {
                            setStatus('idle');
                            setHint(null);
                        }
                    }}
                    onBlur={(e) => {
                        const pin = e.target.value;
                        if (pin.length === 6) lookup(pin);
                    }}
                    style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                    }}
                />
                <button
                    type="button"
                    onClick={() => lookup(value)}
                    disabled={loading || !/^\d{6}$/.test(value)}
                    title="Lookup PIN code"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '0.5rem 0.75rem',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        fontSize: '0.8125rem',
                        cursor: loading || !/^\d{6}$/.test(value) ? 'not-allowed' : 'pointer',
                        opacity: loading || !/^\d{6}$/.test(value) ? 0.5 : 1,
                        flexShrink: 0,
                    }}
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                    {loading ? '' : 'Lookup'}
                </button>
            </div>
            {hint && (
                <div
                    style={{
                        marginTop: 6,
                        fontSize: '0.75rem',
                        color: status === 'ok' ? '#16a34a' : status === 'not_found' ? '#d97706' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    {status === 'ok' ? <Check size={12} /> : <AlertCircle size={12} />}
                    {hint}
                </div>
            )}
        </div>
    );
}
