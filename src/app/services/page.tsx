'use client';

import React from 'react';
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, Variants } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

import { services } from "@/lib/services-data";

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
}

const Card = ({ heading, description, imgSrc, href }: CardProps) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <Link
            href={href}
            style={{ display: 'block', width: '100%', textDecoration: 'none' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={{
                    position: 'relative',
                    height: '420px',
                    borderRadius: '12px',
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
                        filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s ease',
                        zIndex: 0
                    }}
                />

                {/* Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: isHovered ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
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
                                transform: isHovered ? 'rotate(-45deg)' : 'rotate(0deg)',
                                transition: 'transform 0.5s ease'
                            }}
                        />
                    </div>

                    <div>
                        <h3 style={{
                            fontSize: '2.25rem',
                            fontWeight: '700',
                            marginBottom: '0.5rem',
                            color: '#ffffff',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                            {heading.split("").map((letter, index) => (
                                <AnimatedLetter letter={letter} key={index} isHovered={isHovered} />
                            ))}
                        </h3>
                        <p style={{
                            color: isHovered ? '#ffffff' : '#e5e5e5',
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
    return (
        <main className="min-h-screen bg-light-grey">
            <Navigation alwaysScrolled={true} />

            {/* Hero Section */}
            <div className="relative pt-40 pb-24 px-4 min-h-[50vh] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-[#F6F6F5]"
                >
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#F6F6F5]/90 via-[#F6F6F5]/80 to-[#F6F6F5]" />
                </div>

                <div className="relative z-10 container mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-heading font-medium mb-6 tracking-tight text-[#1F524B]">
                        Our Premium Services
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl font-light text-[#0E110F] opacity-80">
                        Expert guidance across all sectors of real estate, from corporate offices to luxury homes.
                    </p>
                </div>
            </div>

            {/* Services Cards */}
            <div className="py-12 bg-[#f7f7f6]">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1.5rem',
                        maxWidth: '1800px',
                        margin: '0 auto',
                        padding: '0 1.5rem',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    {servicesData.map((service, index) => (
                        <Card
                            key={index}
                            heading={service.heading}
                            description={service.description}
                            imgSrc={service.imgSrc}
                            href={service.href}
                        />
                    ))}
                </div>
            </div>

            <Footer />
        </main>
    );
}
