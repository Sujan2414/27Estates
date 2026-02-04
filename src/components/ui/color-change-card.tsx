'use client';

import React from "react";
import { motion, Variants } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";

const servicesData = [
    {
        heading: "Corporate Real Estate",
        description: "Unlock premium office spaces for GCCs and MNCs with expert tenant representation.",
        imgSrc: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
        href: "/services/corporate-real-estate"
    },
    {
        heading: "Residential Real Estate",
        description: "Luxury home sales and management for discerning buyers and investors.",
        imgSrc: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
        href: "/services/residential-real-estate"
    },
    {
        heading: "Warehousing & Logistics",
        description: "Strategic logistics hubs and industrial park solutions for modern supply chains.",
        imgSrc: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
        href: "/services/warehousing-logistics"
    },
    {
        heading: "Land & Industrial",
        description: "Land acquisition, JV structuring, and industrial advisory services.",
        imgSrc: "https://images.unsplash.com/photo-1513828583688-601bf04194c9?auto=format&fit=crop&q=80&w=1200",
        href: "/services/land-industrial"
    },
    {
        heading: "Hospitality & Retail",
        description: "Premier locations for hotels, malls, and retail expansion.",
        imgSrc: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1200",
        href: "/services/hospitality-retail"
    }
];

const ColorChangeCards = () => {
    return (
        <div className="p-4 py-12 md:p-8">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
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
    );
};

// --- Card Component ---
interface CardProps {
    heading: string;
    description: string;
    imgSrc: string;
    href: string;
}

const Card = ({ heading, description, imgSrc, href }: CardProps) => {
    return (
        <Link href={href} className="block w-full">
            <motion.div
                transition={{ staggerChildren: 0.035 }}
                whileHover="hover"
                className="group relative h-64 w-full cursor-pointer overflow-hidden bg-slate-300"
            >
                <div
                    className="absolute inset-0 saturate-100 transition-all duration-500 group-hover:scale-110 md:saturate-0 md:group-hover:saturate-100"
                    style={{
                        backgroundImage: `url(${imgSrc})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="relative z-20 flex h-full flex-col justify-between p-4 text-slate-300 transition-colors duration-500 group-hover:text-white">
                    <FiArrowRight className="ml-auto text-3xl transition-transform duration-500 group-hover:-rotate-45" />
                    <div>
                        <h4>
                            {heading.split("").map((letter, index) => (
                                <AnimatedLetter letter={letter} key={index} />
                            ))}
                        </h4>
                        <p>{description}</p>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

// --- AnimatedLetter Helper Component ---
interface AnimatedLetterProps {
    letter: string;
}

const letterVariants: Variants = {
    hover: {
        y: "-50%",
    },
};

const AnimatedLetter = ({ letter }: AnimatedLetterProps) => {
    return (
        <div className="inline-block h-[36px] overflow-hidden font-semibold text-3xl">
            <motion.span
                className="flex min-w-[4px] flex-col"
                style={{ y: "0%" }}
                variants={letterVariants}
                transition={{ duration: 0.5 }}
            >
                <span>{letter === " " ? "\u00A0" : letter}</span>
                <span>{letter === " " ? "\u00A0" : letter}</span>
            </motion.span>
        </div>
    );
};

export default ColorChangeCards;
