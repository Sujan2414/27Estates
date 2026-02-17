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
    description: "Discover premium properties that redefine luxury living. 27 Estates - your trusted partner for extraordinary real estate in Bangalore.",
    keywords: ["real estate", "luxury homes", "properties", "Bangalore", "premium apartments", "villas", "buy home", "rent home"],
    authors: [{ name: "27 Estates" }],
    creator: "27 Estates",
    publisher: "27 Estates",
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: "27 Estates | Own the Extraordinary",
        description: "Discover premium properties that redefine luxury living in Bangalore.",
        url: 'https://www.27estates.com',
        siteName: '27 Estates',
        images: [
            {
                url: '/opengraph-image.png', // need to add this image to public folder or use a default one
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
        description: "Discover premium properties that redefine luxury living in Bangalore.",
        images: ['/opengraph-image.png'],
    },
    icons: {
        icon: '/favicon.png',
        apple: '/apple-touch-icon.png',
    },
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

