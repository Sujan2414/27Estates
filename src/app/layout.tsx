import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransitionLayout from "@/components/PageTransitionLayout";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

import StickyViewListingsBtn from '@/components/ui/StickyViewListingsBtn';

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
        default: "27 Estates | Own the Extraordinary",
        template: "%s | 27 Estates"
    },
    description: "Discover premium properties that redefine luxury living. 27 Estates - your trusted partner for extraordinary real estate in India's most prime locations.", // Modified
    keywords: ["real estate", "luxury homes", "properties", "India", "Bangalore", "premium apartments", "villas", "buy home", "rent home"], // Added India, kept Bangalore in keywords
    authors: [{ name: "27 Estates" }],
    creator: "27 Estates",
    publisher: "27 Estates",
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: "27 Estates | Own the Extraordinary",
        description: "Discover premium properties that redefine luxury living in India's most prime locations.", // Modified
        url: 'https://www.27estates.com',
        siteName: '27 Estates',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: '27 Estates - Luxury Real Estate',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: "27 Estates | Own the Extraordinary",
        description: "Discover premium properties that redefine luxury living in India's most prime locations.", // Modified
        images: ['/og-image.jpg'],
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "RealEstateAgent",
                            "name": "27 Estates",
                            "url": "https://www.27estates.com",
                            "logo": "https://www.27estates.com/Final_logo.png",
                            "description": "Discover premium properties that redefine luxury living. 27 Estates - your trusted partner for extraordinary real estate in India's most prime locations.",
                            "address": {
                                "@type": "PostalAddress",
                                "streetAddress": "83, Prestige Copper Arch, Infantry Road",
                                "addressLocality": "Bangalore",
                                "addressRegion": "Karnataka",
                                "postalCode": "560001",
                                "addressCountry": "IN"
                            },
                            "telephone": "+918095799929",
                            "email": "connect@27estates.com",
                            "sameAs": [
                                "https://www.linkedin.com/company/27estates/",
                                "https://www.instagram.com/27estates/",
                                "https://www.facebook.com/27estates/"
                            ]
                        })
                    }}
                />
                <AuthProvider>
                    <SmoothScroll>
                        <PageTransitionLayout>
                            {children}
                        </PageTransitionLayout>
                    </SmoothScroll>
                    <StickyViewListingsBtn />
                </AuthProvider>
            </body>
        </html>
    );
}

