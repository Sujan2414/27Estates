import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransitionLayout from "@/components/PageTransitionLayout";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

import StickyViewListingsBtn from '@/components/ui/StickyViewListingsBtn';
import ChatWidget from '@/components/ChatWidget';
import PageTracker from '@/components/PageTracker';
import JsonLd from '@/components/seo/JsonLd';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
    display: 'swap',
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://www.27estates.com'),
    title: {
        default:
            'Luxury Real Estate in Bangalore | Premium Apartments, Villas & New Project Launches | 27 Estates',
        template: '%s | 27 Estates',
    },
    description:
        "Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates — Bangalore's trusted luxury real estate advisory. Explore Whitefield, Sarjapur Road, Koramangala & more.",
    keywords: [
        'luxury real estate bangalore',
        'premium apartments bangalore',
        'luxury villas bangalore',
        'new project launches bangalore',
        'real estate advisory bangalore',
        'property consultant bangalore',
        'whitefield apartments',
        'sarjapur road properties',
    ],
    authors: [{ name: "27 Estates" }],
    creator: "27 Estates",
    publisher: "27 Estates",
    alternates: {
        canonical: '/',
    },
    other: {
        'llms.txt': 'https://www.27estates.com/llms.txt',
        'llms-full.txt': 'https://www.27estates.com/llms-full.txt',
        // Apple Smart App Banner — when someone opens a 27estates.com URL on
        // iOS Safari and the 27 Estates iOS app is installed, Safari shows
        // "Open" to deep-link; otherwise shows "View on App Store" to drive
        // the install.  App-ID below is the ASC id for 27 Estates on iOS.
        'apple-itunes-app': 'app-id=6763353231',
    },
    openGraph: {
        title: 'Luxury Real Estate in Bangalore | Premium Apartments, Villas & New Launches | 27 Estates',
        description:
            "Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates — Bangalore's trusted luxury real estate advisory.",
        url: 'https://www.27estates.com',
        siteName: '27 Estates',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: '27 Estates - Luxury Real Estate in Bangalore',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Luxury Real Estate in Bangalore | 27 Estates',
        description:
            'Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates.',
        images: ['/og-image.jpg'],
    },
    icons: {
        icon: [
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
            { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: [
            { url: '/favicon-32x32.png', type: 'image/png' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    manifest: '/site.webmanifest',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1.0,
    minimumScale: 1.0,
    maximumScale: 5.0,
    userScalable: true,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${playfair.variable} ${inter.variable}`}>
                <JsonLd data={buildOrganizationSchema()} />
                <JsonLd data={buildWebSiteSchema()} />
                <AuthProvider>
                    <SmoothScroll>
                        <PageTransitionLayout>
                            {children}
                        </PageTransitionLayout>
                    </SmoothScroll>
                    <PageTracker />
                    <StickyViewListingsBtn />
                    <ChatWidget />
                </AuthProvider>
            </body>
        </html>
    );
}

