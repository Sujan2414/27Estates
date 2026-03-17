import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f9f6f3',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'var(--font-sans), Inter, sans-serif',
        }}>
            {/* Logo mark */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    marginBottom: '0.5rem',
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #183C38, #2d7a6e)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#BFA270',
                        fontWeight: 800,
                        fontSize: '1rem',
                    }}>
                        27
                    </div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#183C38', letterSpacing: '-0.01em' }}>
                        27 Estates
                    </span>
                </div>
            </div>

            {/* 404 number */}
            <div style={{
                fontSize: 'clamp(6rem, 20vw, 10rem)',
                fontWeight: 800,
                color: '#183C38',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-serif), Georgia, serif',
                opacity: 0.12,
                userSelect: 'none',
                position: 'relative',
            }}>
                404
            </div>

            {/* Divider */}
            <div style={{
                width: '48px',
                height: '2px',
                backgroundColor: '#BFA270',
                margin: '-2rem auto 2rem',
            }} />

            {/* Message */}
            <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: 700,
                color: '#183C38',
                textAlign: 'center',
                marginBottom: '0.75rem',
                fontFamily: 'var(--font-serif), Georgia, serif',
                letterSpacing: '-0.02em',
            }}>
                Page Not Found
            </h1>

            <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                textAlign: 'center',
                maxWidth: '400px',
                lineHeight: 1.7,
                marginBottom: '2.5rem',
            }}>
                The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                Let&apos;s get you back to something extraordinary.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.75rem',
                        backgroundColor: '#183C38',
                        color: '#f9f6f3',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        textDecoration: 'none',
                        transition: 'opacity 0.15s',
                        letterSpacing: '-0.01em',
                    }}
                >
                    ← Back to Home
                </Link>
                <Link
                    href="/properties"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.75rem',
                        backgroundColor: 'transparent',
                        color: '#183C38',
                        border: '1.5px solid #183C38',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                        letterSpacing: '-0.01em',
                    }}
                >
                    Browse Properties
                </Link>
            </div>

            {/* Bottom accent */}
            <p style={{
                marginTop: '4rem',
                fontSize: '0.8125rem',
                color: '#9ca3af',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 500,
            }}>
                Own the Extraordinary
            </p>
        </div>
    )
}
