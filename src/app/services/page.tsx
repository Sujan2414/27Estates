'use client';

import React from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, Variants } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

import { services } from "@/lib/services-data";
import PageHero from "@/components/PageHero";

// Map shared data to component props
const servicesData = services.map(service => ({
    heading: service.title,
    description: service.description,
    imgSrc: service.image,
    href: `/services/${service.slug}`
}));

// --- Components ---

interface CardProps {
    heading: string;
    description: string;
    imgSrc: string;
    href: string;
    isActive: boolean;
    onActivate: () => void;
}

const Card = ({ heading, description, imgSrc, href, isActive, onActivate }: CardProps) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        if (!isMobile) return;

        if (isActive) {
            // Second tap - navigate
            e.preventDefault();
            router.push(href);
        } else {
            // First tap - activate (show color)
            e.preventDefault();
            onActivate();
        }
    };

    const showColor = isMobile ? isActive : isHovered;

    return (
        <Link
            href={href}
            style={{ display: 'block', width: '100%', textDecoration: 'none' }}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
            onClick={handleClick}
        >
            <div
                style={{
                    position: 'relative',
                    minHeight: '280px',
                    height: 'clamp(280px, 50vw, 420px)',
                    overflow: 'hidden',
                    backgroundColor: '#1a1a1a',
                    isolation: 'isolate',
                    cursor: 'pointer'
                }}
            >
                {/* Background Image */}
                <img
                    src={imgSrc}
                    alt={heading}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: showColor ? 'grayscale(0%)' : 'grayscale(100%)',
                        transform: showColor ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s ease',
                        zIndex: 0
                    }}
                />

                {/* Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: showColor ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
                        zIndex: 1,
                        transition: 'background-color 0.5s ease'
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        padding: '2rem',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        color: '#ffffff'
                    }}
                >
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <FiArrowRight
                            style={{
                                fontSize: '1.5rem',
                                color: '#ffffff',
                                transform: showColor ? 'rotate(-45deg)' : 'rotate(0deg)',
                                transition: 'transform 0.5s ease'
                            }}
                        />
                    </div>

                    <div>
                        <h3 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            marginBottom: '0.5rem',
                            color: '#ffffff',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                            {heading.split("").map((letter, index) => (
                                <AnimatedLetter letter={letter} key={index} isHovered={showColor} />
                            ))}
                        </h3>
                        <p style={{
                            color: showColor ? '#ffffff' : '#e5e5e5',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            transition: 'color 0.3s ease'
                        }}>
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};

interface AnimatedLetterProps {
    letter: string;
    isHovered: boolean;
}

const letterVariants: Variants = {
    initial: { y: "0%" },
    hover: { y: "-50%" },
};

const AnimatedLetter = ({ letter, isHovered }: AnimatedLetterProps) => {
    return (
        <div className="inline-block h-[2rem] overflow-hidden">
            <motion.span
                className="flex min-w-[4px] flex-col"
                variants={letterVariants}
                initial="initial"
                animate={isHovered ? "hover" : "initial"}
                transition={{ duration: 0.5 }}
            >
                <span>{letter === " " ? "\u00A0" : letter}</span>
                <span className="text-[#BFA270]">{letter === " " ? "\u00A0" : letter}</span>
            </motion.span>
        </div>
    );
};

export default function ServicesPage() {
    const [activeCardIndex, setActiveCardIndex] = React.useState<number | null>(null);

    return (
        <main className="min-h-screen bg-light-grey">
            <Navigation alwaysScrolled={false} />

            {/* Hero Section */}
            <PageHero
                title="Our Services"
                backgroundImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070"
            />

            {/* Content scrolls over the sticky hero with rounded top corners */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                marginTop: '-24px',
                backgroundColor: '#ffffff',
            }}>
                <div className="container mx-auto px-4" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
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
                            Our Services
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
                            Comprehensive Solutions
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
                            Expert guidance across all sectors of real estate, from corporate offices to luxury homes. We provide comprehensive solutions tailored to your unique needs.
                        </motion.p>
                    </div>

                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
                        style={{
                            maxWidth: '1800px',
                            margin: '0 auto',
                            padding: '0 1rem',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                    >
                        {servicesData.map((service, index) => (
                            <Card
                                key={index}
                                heading={service.heading}
                                description={service.description}
                                imgSrc={service.imgSrc}
                                href={service.href}
                                isActive={activeCardIndex === index}
                                onActivate={() => setActiveCardIndex(index)}
                            />
                        ))}
                    </div>
                </div>

                <Footer />
            </div>
        </main>
    );
}
