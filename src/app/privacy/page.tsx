import React from 'react';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
    title: 'Privacy Policy | 27 Estates',
    description:
        '27 Estates privacy policy — what information we collect, how we use it, who we share it with, and your rights over your data. Applies to our website, our mobile apps, and our CRM.',
    alternates: { canonical: 'https://27estates.com/privacy' },
    robots: { index: true, follow: true },
};

/**
 * Privacy policy — linked from the mobile app (Linking.openURL in app/me.tsx)
 * and published at https://27estates.com/privacy so the Google Play listing
 * and Apple App Store can point to a canonical URL.
 *
 * Written in plain, human English and structured by headings so reviewers
 * can find specific sections (data types, retention, rights) quickly.
 */
export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navigation alwaysScrolled={false} />

            <PageHero
                title="Privacy Policy"
                subtitle="Your data, our responsibility"
                backgroundImage="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=2074"
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
                        27 Estates (“<strong>we</strong>”, “<strong>us</strong>”, “<strong>our</strong>”) operates the website{' '}
                        <a href="https://27estates.com" style={{ color: '#183C38', textDecoration: 'underline' }}>
                            27estates.com
                        </a>{' '}
                        and the 27 Estates mobile apps (the “<strong>Service</strong>”). This Privacy Policy
                        explains what personal information we collect, how we use it, who we share it with,
                        and the choices you have. It applies to visitors, registered users, agents, and
                        employees using any 27 Estates product.
                    </p>

                    <p>
                        By using the Service, you agree to the collection and use of information in accordance
                        with this policy. If you do not agree, please do not use the Service.
                    </p>

                    <h2 style={h2}>1. Who we are</h2>
                    <p>
                        27 Estates is a premium real estate advisory and brokerage firm based at{' '}
                        <em>83, Prestige Copper Arch, Infantry Road, Bangalore 560001, India</em>. You can
                        reach us at <a href="mailto:connect@27estates.com" style={link}>connect@27estates.com</a>{' '}
                        or <a href="tel:+918095799929" style={link}>+91 80957 99929</a>.
                    </p>

                    <h2 style={h2}>2. Information we collect</h2>

                    <h3 style={h3}>a) Information you provide directly</h3>
                    <ul style={ul}>
                        <li><strong>Account</strong>: name, email address, phone number, profile photo (optional), and authentication identifier when you sign up with Google, Apple, Facebook, or email/password.</li>
                        <li><strong>Preferences</strong>: preferred cities, property types, budget range, BHK, and other search filters you set.</li>
                        <li><strong>Listings you submit</strong>: property name, category, photos, address, latitude/longitude, price, bedrooms, bathrooms, amenities, and any other details you add.</li>
                        <li><strong>Enquiries & messages</strong>: contact details and text content when you reach out via forms, the chatbot, or in-app messages.</li>
                        <li><strong>Site-visit bookings</strong>: preferred date, time, and notes.</li>
                    </ul>

                    <h3 style={h3}>b) Information we collect automatically</h3>
                    <ul style={ul}>
                        <li><strong>Location data</strong> — with your explicit permission, we access your device’s GPS location to show nearby listings, auto-detect the city you are in, and place pins on maps. You can revoke this at any time in your device settings.</li>
                        <li><strong>Device & usage</strong> — device model, operating system, app version, language, time zone, IP address, crash reports, and pages/screens viewed. We use this to keep the Service running and fix bugs.</li>
                        <li><strong>Cookies & similar technologies</strong> — used on the website for essential session handling and analytics. You can control cookies in your browser.</li>
                        <li><strong>Push notification token</strong> — when you allow push notifications, your device provides a token we use to send you alerts.</li>
                    </ul>

                    <h3 style={h3}>c) Information our agents/employees provide</h3>
                    <p>
                        Employees logging into our internal HRMS tools provide clock-in/out times, device
                        location (for office attendance verification), and work-mode (office/WFH). This is
                        used only for attendance, payroll, and compliance.
                    </p>

                    <h2 style={h2}>3. How we use your information</h2>
                    <ul style={ul}>
                        <li>Provide, personalise, and improve the Service (show relevant listings, match you with agents, save preferences).</li>
                        <li>Process listing submissions, connect you with property owners/developers, and schedule site visits.</li>
                        <li>Send transactional notifications (listing status updates, booking confirmations, price changes on saved properties).</li>
                        <li>Respond to your support enquiries.</li>
                        <li>Detect and prevent fraud, abuse, and security incidents.</li>
                        <li>Comply with applicable laws (including RERA, income-tax, and KYC requirements where relevant).</li>
                        <li>With your consent, send marketing updates about new launches and featured projects. You can unsubscribe any time.</li>
                    </ul>

                    <h2 style={h2}>4. Who we share your information with</h2>
                    <p>We do not sell your personal data. We share it only in the following ways:</p>
                    <ul style={ul}>
                        <li><strong>27 Estates agents and support staff</strong> — so they can help you with your requirements.</li>
                        <li><strong>Property owners and developers</strong> — limited to the details needed to introduce you (typically name, phone, email, requirement).</li>
                        <li><strong>Service providers</strong> we use to run the Service:
                            Supabase (database + authentication hosting), Vercel (web hosting), Expo (mobile app build + push notifications), Mapbox (maps + geocoding), Resend (transactional email), Google / Apple / Facebook (OAuth sign-in), Sentry (crash reporting), Azure OpenAI (chatbot), Twilio (telephony for AI calls). Each operates under its own contract and security obligations.
                        </li>
                        <li><strong>Law enforcement or regulators</strong> — when required by law, court order, or to protect safety.</li>
                        <li><strong>Successors</strong> in a merger, acquisition, or sale of assets, subject to this policy.</li>
                    </ul>

                    <h2 style={h2}>5. Data retention</h2>
                    <p>
                        We keep your account and listing data for as long as your account is active and for a
                        reasonable period thereafter to comply with our legal obligations or to resolve
                        disputes. Crash logs and analytics are typically retained for 90 days. You can request
                        deletion at any time (see Section 8).
                    </p>

                    <h2 style={h2}>6. Data security</h2>
                    <p>
                        We use industry-standard measures: HTTPS encryption in transit, encryption at rest on
                        our database, row-level security, role-based access controls, and strict limits on who
                        internally can see your data. No method of transmission over the internet is 100%
                        secure, but we do our best to protect it.
                    </p>

                    <h2 style={h2}>7. Children</h2>
                    <p>
                        The Service is not directed to children under the age of 18. We do not knowingly
                        collect personal data from children. If you believe a child has provided us data,
                        contact us and we will delete it.
                    </p>

                    <h2 style={h2}>8. Your rights</h2>
                    <p>Subject to applicable law (including India’s DPDP Act 2023, the EU GDPR, and California CCPA), you have the right to:</p>
                    <ul style={ul}>
                        <li>Access a copy of your personal data.</li>
                        <li>Correct inaccurate data.</li>
                        <li>Delete your account and personal data.</li>
                        <li>Withdraw consent for optional processing (marketing emails, location access).</li>
                        <li>Port your data to another service.</li>
                        <li>Lodge a complaint with a supervisory authority.</li>
                    </ul>
                    <p>
                        To exercise any of these rights, email{' '}
                        <a href="mailto:connect@27estates.com" style={link}>connect@27estates.com</a>. We
                        respond within 30 days.
                    </p>

                    <h2 style={h2}>9. Permissions used by the mobile app</h2>
                    <ul style={ul}>
                        <li><strong>Camera</strong> — to capture photos of properties you are listing or a new profile picture.</li>
                        <li><strong>Photos / Media library</strong> — to attach photos to your listing or profile.</li>
                        <li><strong>Location (while in use)</strong> — to show nearby listings and place your position on the map.</li>
                        <li><strong>Notifications</strong> — to alert you about listing status changes and new matches.</li>
                    </ul>
                    <p>
                        Each permission is optional. You can use most of the app without granting any of them.
                        Revoke any permission any time in your phone’s settings.
                    </p>

                    <h2 style={h2}>10. International transfers</h2>
                    <p>
                        Our primary data storage is in India. Some service providers process data in the
                        United States, European Union, or Singapore. By using the Service you consent to such
                        transfers.
                    </p>

                    <h2 style={h2}>11. Changes to this policy</h2>
                    <p>
                        We may update this Privacy Policy periodically. Material changes will be notified via
                        email or in-app notice. The “Last updated” date at the top always reflects the latest
                        revision.
                    </p>

                    <h2 style={h2}>12. Contact us</h2>
                    <p>
                        <strong>27 Estates</strong>
                        <br />
                        83, Prestige Copper Arch, Infantry Road, Bangalore 560001, India
                        <br />
                        Email: <a href="mailto:connect@27estates.com" style={link}>connect@27estates.com</a>
                        <br />
                        Phone: <a href="tel:+918095799929" style={link}>+91 80957 99929</a>
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

const h3: React.CSSProperties = {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#1f2937',
    marginTop: '1.25rem',
    marginBottom: '0.25rem',
};

const ul: React.CSSProperties = {
    paddingLeft: '1.25rem',
    margin: '0.5rem 0 1rem',
};

const link: React.CSSProperties = {
    color: '#183C38',
    textDecoration: 'underline',
};
