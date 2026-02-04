'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a standard cn utility, if not I'll just use template literals consistently or create it.

interface SectionProps {
    children: ReactNode;
    className?: string;
    id?: string;
    delay?: number;
}

const Section = ({ children, className = '', id, delay = 0 }: SectionProps) => {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
            className={`py-20 md:py-32 px-4 md:px-8 ${className}`}
        >
            <div className="container mx-auto">
                {children}
            </div>
        </motion.section>
    );
};

export default Section;
