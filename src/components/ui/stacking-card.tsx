'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTransform, motion, useScroll } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProjectCardData {
    id: string;
    title: string;
    image: string;
    linkTo: string;
}

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
    const router = useRouter();

    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'start start'],
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
    const scale = useTransform(progress, range, [1, targetScale]);

    return (
        <div
            ref={cardRef}
            className="h-[70vh] md:h-screen flex items-center justify-center sticky top-0"
        >
            <motion.div
                style={{
                    scale,
                    top: `calc(-5vh + ${i * 25}px)`,
                    cursor: 'pointer',
                }}
                className="relative -top-[25%] w-[90%] max-w-[1200px] h-[50vh] md:h-[70vh] rounded-xl overflow-hidden shadow-2xl origin-top"
                onClick={() => router.push(project.linkTo)}
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
    const { showAuthModal } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    return (
        <section ref={containerRef} style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
            {/* Header */}
            {showHeader && (
                <div className="h-[30vh] md:h-[50vh] flex flex-col items-center justify-center text-center px-6">
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
                            color: '#1F524B'
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
                    <button
                        onClick={() => showAuthModal('/properties')}
                        style={ctaButtonStyles}
                        className="hover:bg-[#2d7a6e] hover:border-[#2d7a6e] cursor-pointer"
                    >
                        View All Projects
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

interface StackingCardsProps {
    showHeader?: boolean;
}

// Fallback data in case DB is empty
const fallbackProjects: ProjectCardData[] = [
    {
        id: '1',
        title: 'Serenity Heights',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        linkTo: '/projects',
    },
    {
        id: '2',
        title: 'Azure Villas',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
        linkTo: '/projects',
    },
    {
        id: '3',
        title: 'The Grand Arch',
        image: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&auto=format&fit=crop&q=80',
        linkTo: '/projects',
    }
];

export function StackingCards({ showHeader = true }: StackingCardsProps) {
    const [projects, setProjects] = useState<ProjectCardData[]>([]);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // First try: projects with ad cards enabled for homepage
                const { data: adProjects } = await supabase
                    .from('projects')
                    .select('id, project_name, ad_card_image')
                    .eq('show_ad_on_home', true)
                    .not('ad_card_image', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (adProjects && adProjects.length > 0) {
                    const formatted: ProjectCardData[] = adProjects.map(p => ({
                        id: p.id,
                        title: p.project_name,
                        image: p.ad_card_image!,
                        linkTo: `/projects/${p.id}`,
                    }));
                    setProjects(formatted);
                    return;
                }

                // Fallback: featured projects
                const { data: featuredProjects } = await supabase
                    .from('projects')
                    .select('id, project_name, images, location, city')
                    .eq('is_featured', true)
                    .limit(5);

                if (featuredProjects && featuredProjects.length > 0) {
                    const formatted: ProjectCardData[] = featuredProjects.map((p, index) => ({
                        id: p.id,
                        title: p.project_name,
                        image: p.images?.[0] || fallbackProjects[index % fallbackProjects.length].image,
                        linkTo: `/projects/${p.id}`,
                    }));
                    setProjects(formatted);
                } else {
                    setProjects(fallbackProjects);
                }
            } catch (error) {
                console.error('Error loading projects:', error);
                setProjects(fallbackProjects);
            }
        };

        fetchProjects();
    }, [supabase]);

    // Don't render until mounted to avoid hydration issues
    if (!mounted || projects.length === 0) {
        return (
            <div className="h-[70vh] md:h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
                <div className="text-gray-400">Loading projects...</div>
            </div>
        );
    }

    return <StackingCardsContent projects={projects} showHeader={showHeader} />;
}

export default StackingCards;
