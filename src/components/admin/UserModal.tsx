'use client';

import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface UserModalProps {
    onClose: () => void;
    onComplete: () => void;
}

export default function UserModal({ onClose, onComplete }: UserModalProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, role })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create user');
            }

            onComplete();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        display: 'flex',
        width: '100%',
        height: '48px',
        padding: '0 14px',
        borderRadius: '12px',
        border: '1.5px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        color: '#111827',
        fontSize: '0.9375rem',
        outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '6px',
        letterSpacing: '0.01em',
    };

    return (
        <DialogPrimitive.Root open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                {/* Overlay */}
                <DialogPrimitive.Overlay
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.2s ease',
                    }}
                />

                {/* Modal Content */}
                <DialogPrimitive.Content
                    style={{
                        position: 'fixed',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10000,
                        width: 'calc(100% - 2rem)',
                        maxWidth: '480px',
                        backgroundColor: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        border: 'none',
                        overflow: 'hidden',
                        animation: 'modalSlideIn 0.3s ease',
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '28px 32px 12px', position: 'relative' }}>
                        <DialogPrimitive.Title
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#111827',
                                margin: 0,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.3,
                            }}
                        >
                            Add New User
                        </DialogPrimitive.Title>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            marginTop: '6px',
                            lineHeight: 1.5,
                        }}>
                            Enter the details to create a new user account.
                        </p>

                        {/* Close button */}
                        <DialogPrimitive.Close
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e5e7eb';
                                e.currentTarget.style.color = '#111827';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                e.currentTarget.style.color = '#6b7280';
                            }}
                        >
                            <X size={16} />
                        </DialogPrimitive.Close>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0 32px' }} />

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px' }}>
                        {error && (
                            <div style={{
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                border: '1px solid #fecaca',
                                marginBottom: '20px',
                                textAlign: 'center',
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {/* Full Name */}
                            <div>
                                <label htmlFor="modal-fullName" style={labelStyle}>Full Name</label>
                                <input
                                    id="modal-fullName"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#1F524B';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 82, 75, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="modal-email" style={labelStyle}>Email Address</label>
                                <input
                                    id="modal-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#1F524B';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 82, 75, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="modal-password" style={labelStyle}>Password</label>
                                <input
                                    id="modal-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#1F524B';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 82, 75, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label htmlFor="modal-role" style={labelStyle}>Role</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        id="modal-role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        style={{
                                            ...inputStyle,
                                            appearance: 'none',
                                            paddingRight: '40px',
                                            cursor: 'pointer',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#1F524B';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 82, 75, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="user">User</option>
                                        <option value="agent">Agent</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <div style={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none',
                                        color: '#9ca3af',
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            marginTop: '28px',
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    height: '44px',
                                    padding: '0 24px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    height: '44px',
                                    padding: '0 28px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: '#1F524B',
                                    color: '#ffffff',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontFamily: 'inherit',
                                    boxShadow: '0 4px 14px rgba(31, 82, 75, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: loading ? 0.7 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) e.currentTarget.style.backgroundColor = '#163c37';
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) e.currentTarget.style.backgroundColor = '#1F524B';
                                }}
                            >
                                {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
