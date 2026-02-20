'use client'

import { useState, FormEvent } from 'react'
import { ChevronDown, Users, TrendingDown, Shield, HelpCircle, Phone, X } from 'lucide-react'

interface FAQItem {
    question: string
    answer: string
    icon: React.ReactNode
}

const faqData: FAQItem[] = [
    {
        question: 'What is Group Buy?',
        answer: '27 Estates brings together a group of genuine home buyers interested in the same project. By consolidating demand, we negotiate directly with the developer to secure the best possible price — far better than what any individual buyer could get alone.',
        icon: <Users size={18} />,
    },
    {
        question: "What's in it for me?",
        answer: "You get access to exclusive group discounts, priority unit selection, and transparent pricing. Our group buying power typically saves buyers 5-15% compared to the listed price. Plus, you benefit from our team's due diligence on the project.",
        icon: <TrendingDown size={18} />,
    },
    {
        question: "What's in it for 27 Estates?",
        answer: "We earn a referral commission from the developer — not from you. Our interests are aligned: we only succeed when you get a great deal. This means our service is completely free for home buyers.",
        icon: <Shield size={18} />,
    },
    {
        question: 'How do I join Group Buy?',
        answer: "Simply click 'Join Group Buy' below or 'Talk to an Expert'. Our team will get in touch, explain the current group buy opportunities for this project, and guide you through the entire process — from registration to possession.",
        icon: <HelpCircle size={18} />,
    },
]

// Stock image: group of people discussing real estate / property deal
const GROUP_BUY_HERO_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80";

interface GroupBuyProps {
    projectName: string
    projectImage?: string
    agentPhone?: string
}

export default function GroupBuySection({ projectName, agentPhone }: GroupBuyProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    phone: phone || null,
                    message: `[Group Buy Interest - ${projectName}] ${message}`,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to submit')
            }

            setSuccess(true)
            setFirstName('')
            setLastName('')
            setEmail('')
            setPhone('')
            setMessage('')
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        background: '#141414',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#fafafa',
        fontSize: '0.9375rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#a3a3a3',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '6px',
    }

    return (
        <>
            <section style={{
                background: '#0a0a0a',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #262626',
                maxWidth: '1200px',
                margin: '3rem auto',
            }}>
                {/* Hero Banner with Stock Image */}
                <div style={{
                    position: 'relative', width: '100%', height: '320px', overflow: 'hidden',
                }}>
                    <img
                        src={GROUP_BUY_HERO_IMAGE}
                        alt="Group Buy - Save together on your dream home"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    {/* Overlays */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.75) 100%)',
                    }} />
                    {/* Large decorative icon */}
                    <div style={{ position: 'absolute', top: '40px', right: '60px', opacity: 0.08 }}>
                        <Users size={180} color="#d4a853" />
                    </div>
                    {/* Badge */}
                    <div style={{
                        position: 'absolute', bottom: '24px', left: '32px', zIndex: 1,
                    }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            background: 'linear-gradient(135deg, #d4a853, #c9913c)',
                            color: '#0a0a0a',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '12px',
                        }}>
                            Group Buy Explained
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '32px 32px 16px' }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 300,
                        color: '#fafafa',
                        lineHeight: 1.3,
                        marginBottom: '8px',
                    }}>
                        Get the <strong style={{ fontWeight: 700 }}>BEST DEAL</strong> on your Dream Home with
                    </h2>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#d4a853',
                        marginBottom: '20px',
                        letterSpacing: '0.02em',
                    }}>
                        the power of GROUP BUY
                    </h3>
                    <p style={{
                        fontSize: '0.9375rem',
                        color: '#a3a3a3',
                        lineHeight: 1.7,
                        maxWidth: '700px',
                        marginBottom: '32px',
                    }}>
                        27 Estates brings together interested buyers for <strong style={{ color: '#d4d4d4' }}>{projectName}</strong> and
                        negotiates directly with the developer to get you the absolute <strong style={{ color: '#d4a853' }}>BEST discounted price</strong> for
                        the property.
                    </p>

                    {/* Accordion FAQ */}
                    <div style={{ borderTop: '1px solid #262626' }}>
                        {faqData.map((faq, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #262626' }}>
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '18px 8px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#fafafa',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        textAlign: 'left',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <span style={{
                                            color: '#737373',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            minWidth: '20px',
                                        }}>
                                            {index + 1}.
                                        </span>
                                        <span style={{ color: '#d4a853', display: 'flex', alignItems: 'center' }}>
                                            {faq.icon}
                                        </span>
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        size={20}
                                        style={{
                                            color: '#737373',
                                            transition: 'transform 0.3s ease',
                                            transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                                            flexShrink: 0,
                                        }}
                                    />
                                </button>
                                <div style={{
                                    maxHeight: openIndex === index ? '200px' : '0',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease, padding 0.3s ease',
                                    padding: openIndex === index ? '0 8px 18px 52px' : '0 8px 0 52px',
                                }}>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: '#a3a3a3',
                                        lineHeight: 1.7,
                                        margin: 0,
                                    }}>
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Footer */}
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    borderTop: '1px solid #262626',
                    background: 'linear-gradient(to bottom, #0f0f0f, #0a0a0a)',
                }}>
                    <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#fafafa',
                        marginBottom: '6px',
                    }}>
                        Guaranteed Savings with <span style={{ color: '#d4a853' }}>GROUP BUY</span>
                    </h4>
                    <p style={{
                        fontSize: '0.875rem',
                        color: '#737373',
                        marginBottom: '24px',
                    }}>
                        Trusted by 1000s of Happy 27 Estates Customers.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 32px',
                                background: 'linear-gradient(135deg, #d4a853, #c9913c)',
                                color: '#0a0a0a',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9375rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.02em',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 168, 83, 0.3)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            <Users size={18} />
                            Join Group Buy
                        </button>

                        <a
                            href={agentPhone ? `tel:${agentPhone}` : 'tel:+919999999999'}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 32px',
                                background: 'transparent',
                                color: '#fafafa',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#d4a853'
                                e.currentTarget.style.color = '#d4a853'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#404040'
                                e.currentTarget.style.color = '#fafafa'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <Phone size={18} />
                            Talk to an Expert
                        </a>
                    </div>

                    <p style={{
                        fontSize: '0.75rem',
                        color: '#525252',
                        marginTop: '20px',
                        lineHeight: 1.5,
                    }}>
                        Experience unbiased advisory, get total peace of mind & buy confidently with 27 Estates.
                        <br />
                        <span style={{ color: '#d4a853', fontWeight: 600 }}>100% Free of Charge</span>
                    </p>
                </div>
            </section>

            {/* Contact Form Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowModal(false)}
                >
                    {/* Backdrop */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                    }} />

                    {/* Modal */}
                    <div
                        style={{
                            position: 'relative',
                            background: '#0a0a0a',
                            border: '1px solid #262626',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '520px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '0',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header with Stock Image */}
                        <div style={{
                            position: 'relative',
                            height: '140px',
                            overflow: 'hidden',
                            borderRadius: '16px 16px 0 0',
                        }}>
                            <img
                                src={GROUP_BUY_HERO_IMAGE}
                                alt="Group Buy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to bottom, rgba(10,10,10,0.3), rgba(10,10,10,0.85))',
                            }} />
                            <div style={{ position: 'absolute', bottom: '16px', left: '24px', zIndex: 1 }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    background: 'linear-gradient(135deg, #d4a853, #c9913c)',
                                    color: '#0a0a0a',
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '6px',
                                }}>
                                    Group Buy
                                </span>
                                <p style={{ color: '#fafafa', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                    {projectName}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 2,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '24px' }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#fafafa',
                                marginBottom: '4px',
                            }}>
                                Join Group Buy
                            </h3>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#737373',
                                marginBottom: '24px',
                                lineHeight: 1.5,
                            }}>
                                Fill in your details and our team will reach out with the best group buy deal.
                            </p>

                            {success && (
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    marginBottom: '16px',
                                    fontSize: '0.875rem',
                                    color: '#22c55e',
                                }}>
                                    Thank you! Our team will contact you shortly with Group Buy details.
                                </div>
                            )}

                            {error && (
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    marginBottom: '16px',
                                    fontSize: '0.875rem',
                                    color: '#ef4444',
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>First Name *</label>
                                        <input
                                            type="text"
                                            placeholder="John"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            style={inputStyle}
                                            onFocus={(e) => (e.target.style.borderColor = '#d4a853')}
                                            onBlur={(e) => (e.target.style.borderColor = '#333')}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            style={inputStyle}
                                            onFocus={(e) => (e.target.style.borderColor = '#d4a853')}
                                            onBlur={(e) => (e.target.style.borderColor = '#333')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={inputStyle}
                                        onFocus={(e) => (e.target.style.borderColor = '#d4a853')}
                                        onBlur={(e) => (e.target.style.borderColor = '#333')}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Phone *</label>
                                    <input
                                        type="tel"
                                        placeholder="+91 99999 99999"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={inputStyle}
                                        onFocus={(e) => (e.target.style.borderColor = '#d4a853')}
                                        onBlur={(e) => (e.target.style.borderColor = '#333')}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Message</label>
                                    <textarea
                                        placeholder="Tell us about your requirements..."
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        style={{
                                            ...inputStyle,
                                            resize: 'vertical',
                                            minHeight: '80px',
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = '#d4a853')}
                                        onBlur={(e) => (e.target.style.borderColor = '#333')}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: submitting
                                            ? '#8a7a4a'
                                            : 'linear-gradient(135deg, #d4a853, #c9913c)',
                                        color: '#0a0a0a',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.9375rem',
                                        fontWeight: 700,
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        letterSpacing: '0.02em',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <Users size={18} />
                                    {submitting ? 'Submitting...' : 'Join Group Buy'}
                                </button>

                                <p style={{
                                    fontSize: '0.75rem',
                                    color: '#525252',
                                    textAlign: 'center',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}>
                                    Our service is <span style={{ color: '#d4a853', fontWeight: 600 }}>100% free</span> for home buyers. No hidden charges.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
