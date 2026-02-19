'use client';

import React, { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

interface Contact2Props {
    title?: string;
    description?: string;
    phone?: string;
    email?: string;
}

export const Contact2 = ({
    title = 'Reach Out',
    description = "Whether you're looking to buy, sell, or invest in premium real estate, our team is here to guide you every step of the way.",
    phone = '+91 98446 53113',
    email = 'connect@27estates.com',
}: Contact2Props) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email: formEmail,
                    phone: formPhone || null,
                    message,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit');
            }

            setSuccess(true);
            setFirstName('');
            setLastName('');
            setFormEmail('');
            setFormPhone('');
            setMessage('');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section style={{ padding: '5rem 0' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)' }}>
                {/* Section Header */}
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6 }}
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: '#BFA270',
                            marginBottom: '1rem',
                        }}
                    >
                        Contact Us
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: 500,
                            letterSpacing: '-0.02em',
                            color: '#183C38',
                            marginBottom: '1.25rem',
                            lineHeight: 1.2,
                        }}
                    >
                        {title}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '1.0625rem',
                            lineHeight: 1.7,
                            color: '#0E110F',
                            opacity: 0.8,
                            maxWidth: '500px',
                            margin: '0 auto',
                        }}
                    >
                        {description}
                    </motion.p>
                </div>

                {/* Two Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '3rem',
                }}>
                    {/* Contact Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                        }}
                    >
                        {[
                            { icon: MapPin, label: 'Visit Us', value: '83, Prestige Copper Arch, Infantry Road', sub: 'Bangalore, Karnataka 560001' },
                            { icon: Phone, label: 'Call Us', value: phone, sub: 'Mon–Fri, 9am – 6pm' },
                            { icon: Mail, label: 'Email Us', value: email, sub: 'We reply within 24 hours' },
                            { icon: Clock, label: 'Working Hours', value: 'Mon – Sat: 9am – 7pm', sub: 'Sunday by appointment' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(43, 54, 66, 0.08)',
                                    transition: 'box-shadow 0.3s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(43, 54, 66, 0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(31, 82, 75, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.25rem',
                                    color: '#183C38',
                                }}>
                                    <item.icon size={20} />
                                </div>
                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#BFA270',
                                    marginBottom: '0.5rem',
                                }}>
                                    {item.label}
                                </p>
                                <p style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.125rem',
                                    fontWeight: 500,
                                    color: '#183C38',
                                    marginBottom: '0.25rem',
                                }}>
                                    {item.value}
                                </p>
                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.875rem',
                                    color: '#0E110F',
                                    opacity: 0.5,
                                }}>
                                    {item.sub}
                                </p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                            backgroundColor: '#f9f6f3',
                            borderRadius: '16px',
                            padding: 'clamp(2rem, 4vw, 3.5rem)',
                        }}
                    >
                        <h3 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.75rem',
                            fontWeight: 500,
                            color: '#183C38',
                            marginBottom: '0.5rem',
                        }}>
                            Send a Message
                        </h3>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9375rem',
                            color: '#0E110F',
                            opacity: 0.6,
                            marginBottom: '2.5rem',
                        }}>
                            Fill out the form below and our team will get back to you within 24 hours.
                        </p>

                        {success && (
                            <div style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(31, 82, 75, 0.08)',
                                border: '1px solid rgba(31, 82, 75, 0.2)',
                                marginBottom: '1.5rem',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.9375rem',
                                color: '#183C38',
                            }}>
                                Thank you! Your message has been sent. We&apos;ll get back to you within 24 hours.
                            </div>
                        )}

                        {error && (
                            <div style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(220, 38, 38, 0.06)',
                                border: '1px solid rgba(220, 38, 38, 0.2)',
                                marginBottom: '1.5rem',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.9375rem',
                                color: '#dc2626',
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.75rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        color: '#0E110F',
                                        marginBottom: '0.5rem',
                                    }}>First Name</label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        required
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 0',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid rgba(43, 54, 66, 0.2)',
                                            outline: 'none',
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.9375rem',
                                            color: '#0E110F',
                                            transition: 'border-color 0.3s ease',
                                        }}
                                        onFocus={e => (e.target.style.borderBottomColor = '#183C38')}
                                        onBlur={e => (e.target.style.borderBottomColor = 'rgba(43, 54, 66, 0.2)')}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        color: '#0E110F',
                                        marginBottom: '0.5rem',
                                    }}>Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 0',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid rgba(43, 54, 66, 0.2)',
                                            outline: 'none',
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.9375rem',
                                            color: '#0E110F',
                                            transition: 'border-color 0.3s ease',
                                        }}
                                        onFocus={e => (e.target.style.borderBottomColor = '#183C38')}
                                        onBlur={e => (e.target.style.borderBottomColor = 'rgba(43, 54, 66, 0.2)')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#0E110F',
                                    marginBottom: '0.5rem',
                                }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    value={formEmail}
                                    onChange={e => setFormEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 0',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(43, 54, 66, 0.2)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.9375rem',
                                        color: '#0E110F',
                                        transition: 'border-color 0.3s ease',
                                    }}
                                    onFocus={e => (e.target.style.borderBottomColor = '#183C38')}
                                    onBlur={e => (e.target.style.borderBottomColor = 'rgba(43, 54, 66, 0.2)')}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#0E110F',
                                    marginBottom: '0.5rem',
                                }}>Phone</label>
                                <input
                                    type="tel"
                                    placeholder="+91 99999 99999"
                                    value={formPhone}
                                    onChange={e => setFormPhone(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 0',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(43, 54, 66, 0.2)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.9375rem',
                                        color: '#0E110F',
                                        transition: 'border-color 0.3s ease',
                                    }}
                                    onFocus={e => (e.target.style.borderBottomColor = '#183C38')}
                                    onBlur={e => (e.target.style.borderBottomColor = 'rgba(43, 54, 66, 0.2)')}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#0E110F',
                                    marginBottom: '0.5rem',
                                }}>Message</label>
                                <textarea
                                    placeholder="Tell us about your requirements..."
                                    rows={4}
                                    required
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 0',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(43, 54, 66, 0.2)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.9375rem',
                                        color: '#0E110F',
                                        resize: 'vertical',
                                        minHeight: '120px',
                                        transition: 'border-color 0.3s ease',
                                    }}
                                    onFocus={e => (e.target.style.borderBottomColor = '#183C38')}
                                    onBlur={e => (e.target.style.borderBottomColor = 'rgba(43, 54, 66, 0.2)')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    backgroundColor: submitting ? '#8aafa9' : '#183C38',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.3s ease',
                                    marginTop: '0.5rem',
                                }}
                                onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#2d7a6e'; }}
                                onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#183C38'; }}
                            >
                                {submitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
