import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google"; // Keep fonts if needed, but globals.css handles them too.
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

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
    title: "27 Estates | Own the Extraordinary",
    description: "Discover premium properties that redefine luxury living. 27 Estates - your trusted partner for extraordinary real estate in Bangalore.",
    keywords: ["real estate", "luxury homes", "properties", "Bangalore", "premium apartments", "villas"],
    openGraph: {
        title: "27 Estates | Own the Extraordinary",
        description: "Discover premium properties that redefine luxury living.",
        type: "website",
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
                <SmoothScroll>
                    {children}
                </SmoothScroll>
            </body>
        </html>
    );
}
