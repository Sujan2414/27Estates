import React from 'react';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
    title: 'Terms of Use | 27 Estates',
    description:
        '27 Estates terms of use — the rules for using our website, mobile apps, and services.',
    alternates: { canonical: 'https://27estates.com/terms' },
    robots: { index: true, follow: true },
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navigation alwaysScrolled={false} />

            <PageHero
                title="Terms of Use"
                subtitle="The rules for using 27 Estates"
                backgroundImage="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=2070"
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: '24px 24px 0 0',
                    marginTop: '-24px',
                    backgroundColor: '#ffffff',
                }}
            >
                <article
                    style={{
                        maxWidth: 820,
                        margin: '0 auto',
                        padding: '3rem 1.25rem 5rem',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        color: '#2a2a2a',
                    }}
                >
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <strong>Last updated:</strong> 23 April 2026
                    </p>

                    <p>
                        Welcome to 27 Estates. These Terms of Use (“<strong>Terms</strong>”) govern your use
                        of the 27estates.com website and our mobile apps (together, the “<strong>Service</strong>”).
                        By using the Service you agree to these Terms. If you do not agree, please do not use
                        the Service.
                    </p>

                    <h2 style={h2}>1. Who can use the Service</h2>
                    <p>
                        You must be at least 18 years old and legally capable of entering into a binding
                        contract under Indian law. If you are using the Service on behalf of a company, you
                        represent that you have authority to bind that company.
                    </p>

                    <h2 style={h2}>2. Your account</h2>
                    <p>
                        You are responsible for any activity that occurs under your account. Keep your
                        credentials confidential and notify us immediately at{' '}
                        <a href="mailto:connect@27estates.com" style={link}>connect@27estates.com</a> if you
                        suspect unauthorised access.
                    </p>

                    <h2 style={h2}>3. Listings you submit</h2>
                    <ul style={ul}>
                        <li>You must own, or have the right to list, the property you submit.</li>
                        <li>All information you provide must be accurate, lawful, and not misleading.</li>
                        <li>You grant 27 Estates a non-exclusive, worldwide, royalty-free licence to host, display, and promote your listing photos and details through the Service and connected marketing channels.</li>
                        <li>We review every submission. We may reject, edit, or remove listings that violate these Terms, local regulations (including RERA), or our review standards — at our discretion.</li>
                        <li>You remain responsible for the legality of the property you list.</li>
                    </ul>

                    <h2 style={h2}>4. 27 Estates is a facilitator</h2>
                    <p>
                        We connect buyers, sellers, and tenants. Except where explicitly stated, we are not a
                        party to any transaction between users. We do not guarantee that a listed property is
                        available, accurately described, or free of disputes. Any transaction is solely
                        between you and the other party; please do your own due diligence.
                    </p>

                    <h2 style={h2}>5. Brokerage & fees</h2>
                    <p>
                        When 27 Estates acts as your broker, a separate engagement letter sets out fees,
                        scope, and deliverables. Creating an account or browsing listings does not by itself
                        create a brokerage relationship.
                    </p>

                    <h2 style={h2}>6. Acceptable use</h2>
                    <p>You agree NOT to:</p>
                    <ul style={ul}>
                        <li>Post false, misleading, or illegal content.</li>
                        <li>Impersonate another person or organisation.</li>
                        <li>Scrape, crawl, or reverse-engineer the Service.</li>
                        <li>Attempt to disrupt or degrade the Service.</li>
                        <li>Use the Service to send spam or unsolicited communications.</li>
                        <li>Upload viruses, malware, or any harmful code.</li>
                    </ul>

                    <h2 style={h2}>7. Intellectual property</h2>
                    <p>
                        All content on the Service that isn’t user-submitted — logos, text, design, code — is
                        owned by 27 Estates or our licensors and is protected by copyright and trademark law.
                        You may not copy or reuse it without permission.
                    </p>

                    <h2 style={h2}>8. Termination</h2>
                    <p>
                        We may suspend or terminate your access at any time for a violation of these Terms or
                        for any reason we deem reasonable. You may delete your account at any time from
                        within the app or by emailing us.
                    </p>

                    <h2 style={h2}>9. Disclaimers</h2>
                    <p>
                        The Service is provided “as is” and “as available”. We make no warranty that it will
                        be uninterrupted, error-free, or accurate. Prices, availability, and specifications
                        of properties may change without notice.
                    </p>

                    <h2 style={h2}>10. Limitation of liability</h2>
                    <p>
                        To the maximum extent permitted by law, 27 Estates will not be liable for any
                        indirect, incidental, special, or consequential damages arising out of your use of
                        the Service. Our total liability for any claim arising from the Service shall not
                        exceed INR 10,000.
                    </p>

                    <h2 style={h2}>11. Governing law</h2>
                    <p>
                        These Terms are governed by the laws of India. Any dispute will be subject to the
                        exclusive jurisdiction of the courts of Bangalore, Karnataka.
                    </p>

                    <h2 style={h2}>12. Changes to these Terms</h2>
                    <p>
                        We may update these Terms from time to time. Material changes will be announced in
                        the app or by email. Continued use of the Service after an update means you accept
                        the new Terms.
                    </p>

                    <h2 style={h2}>13. Contact us</h2>
                    <p>
                        <strong>27 Estates</strong>
                        <br />
                        83, Prestige Copper Arch, Infantry Road, Bangalore 560001, India
                        <br />
                        Email: <a href="mailto:connect@27estates.com" style={link}>connect@27estates.com</a>
                        <br />
                        Phone: <a href="tel:+918095799929" style={link}>+91 80957 99929</a>
                    </p>

                    <p style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: 8, fontSize: '0.9rem' }}>
                        See also our{' '}
                        <a href="/privacy" style={link}>Privacy Policy</a> — it explains what personal data we
                        collect and how we use it.
                    </p>
                </article>
            </div>

            <Footer />
        </main>
    );
}

const h2: React.CSSProperties = {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#183C38',
    marginTop: '2.25rem',
    marginBottom: '0.5rem',
};

const ul: React.CSSProperties = {
    paddingLeft: '1.25rem',
    margin: '0.5rem 0 1rem',
};

const link: React.CSSProperties = {
    color: '#183C38',
    textDecoration: 'underline',
};
