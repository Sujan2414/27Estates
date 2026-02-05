'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTransform, motion, useScroll } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectCardData {
    id: string;
    title: string;
    location: string;
    price: string;
    status: string;
    image: string;
}

// Real estate project ad style images
const projectImages = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80',
];

// CTA Button styles matching ContactCTA
const ctaButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.875rem 1.75rem',
    backgroundColor: 'var(--dark-turquoise, #1F524B)',
    color: '#ffffff',
    fontSize: '0.8125rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    border: '1px solid var(--dark-turquoise, #1F524B)',
};

interface CardProps {
    i: number;
    project: ProjectCardData;
    progress: ReturnType<typeof useScroll>['scrollYProgress'];
    range: [number, number];
    targetScale: number;
}

const ProjectCard = ({ i, project, progress, range, targetScale }: CardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'start start'],
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
    const scale = useTransform(progress, range, [1, targetScale]);

    return (
        <div
            ref={cardRef}
            className="h-screen flex items-center justify-center sticky top-0"
        >
            <motion.div
                style={{
                    scale,
                    top: `calc(-5vh + ${i * 25}px)`,
                }}
                className="relative -top-[25%] w-[90%] max-w-[1200px] h-[70vh] rounded-xl overflow-hidden shadow-2xl origin-top"
            >
                {/* Full Background Image */}
                <motion.div
                    className="absolute inset-0"
                    style={{ scale: imageScale }}
                >
                    <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Status Badge - Top Left */}
                <div className="absolute top-6 left-6 z-10">
                    <span
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full"
                        style={{
                            backgroundColor: 'var(--gold, #BFA270)',
                            color: '#1a1a1a'
                        }}
                    >
                        {project.status}
                    </span>
                </div>

                {/* Content Overlay - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        {/* Text Content */}
                        <div>
                            <h3
                                className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-3"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                {project.title}
                            </h3>
                            <div className="flex items-center gap-2 text-white/80">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm md:text-base">{project.location}</span>
                                <span className="mx-2 text-white/40">|</span>
                                <span className="text-sm md:text-base" style={{ color: 'var(--gold, #BFA270)' }}>
                                    {project.price}
                                </span>
                            </div>
                        </div>

                        {/* CTA Button - matching ContactCTA style */}
                        <motion.div whileHover={{ y: -2 }}>
                            <Link
                                href={`/projects/${project.id}`}
                                style={ctaButtonStyles}
                                className="hover:bg-[#2d7a6e] hover:border-[#2d7a6e]"
                            >
                                View Project
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Inner component - only rendered after mount
function StackingCardsContent({
    projects,
    showHeader
}: {
    projects: ProjectCardData[];
    showHeader: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    return (
        <section ref={containerRef} style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
            {/* Header */}
            {showHeader && (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center px-6">
                    <motion.p
                        className="text-sm font-medium uppercase tracking-[0.2em] mb-3"
                        style={{ color: 'var(--gold, #BFA270)' }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        New Developments
                    </motion.p>
                    <motion.h2
                        className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4"
                        style={{
                            fontFamily: 'var(--font-heading)',
                            color: '#1a1a1a'
                        }}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Exclusive Projects
                    </motion.h2>
                    <motion.p
                        className="max-w-xl mx-auto text-base"
                        style={{ color: '#666666' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Handpicked premium developments for discerning buyers
                    </motion.p>
                </div>
            )}

            {/* Stacking Cards */}
            <div>
                {projects.map((project, i) => {
                    const targetScale = 1 - (projects.length - i) * 0.05;
                    return (
                        <ProjectCard
                            key={project.id}
                            i={i}
                            project={project}
                            progress={scrollYProgress}
                            range={[i * 0.25, 1]}
                            targetScale={targetScale}
                        />
                    );
                })}
            </div>

            {/* View All Button */}
            <div className="h-40 flex items-center justify-center">
                <motion.div whileHover={{ y: -2 }}>
                    <Link
                        href="/projects"
                        style={ctaButtonStyles}
                        className="hover:bg-[#2d7a6e] hover:border-[#2d7a6e]"
                    >
                        View All Projects
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

interface StackingCardsProps {
    showHeader?: boolean;
}

export function StackingCards({ showHeader = true }: StackingCardsProps) {
    const [projects, setProjects] = useState<ProjectCardData[]>([]);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('is_featured', true)
                .limit(5);

            if (data && data.length > 0) {
                const formattedProjects: ProjectCardData[] = data.map((p, index) => ({
                    id: p.id,
                    title: p.project_name,
                    location: p.location || p.city || 'Bangalore',
                    price: p.min_price || 'Price on Request',
                    status: p.status || 'New Launch',
                    image: p.images?.[0] || projectImages[index % projectImages.length],
                }));
                setProjects(formattedProjects);
            }
        };

        fetchProjects();
    }, [supabase]);

    // Don't render until mounted to avoid hydration issues
    if (!mounted || projects.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
                <div className="text-gray-400">Loading projects...</div>
            </div>
        );
    }

    return <StackingCardsContent projects={projects} showHeader={showHeader} />;
}

export default StackingCards;
