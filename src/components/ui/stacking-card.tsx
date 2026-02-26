'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTransform, motion, useScroll } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MapPin } from 'lucide-react';

interface ProjectCardData {
    id: string;
    title: string;
    image: string;
    linkTo: string;
    location?: string;
    city?: string;
    developer_name?: string;
    min_price?: string;
    max_price?: string;
    status?: string;
}

// CTA Button styles matching ContactCTA
const ctaButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.875rem 1.75rem',
    backgroundColor: 'var(--dark-turquoise, #183C38)',
    color: '#ffffff',
    fontSize: '0.8125rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    border: '1px solid var(--dark-turquoise, #183C38)',
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
    const { checkAuthAndNavigate } = useAuth();
    const [hovered, setHovered] = useState(false);

    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'start start'],
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
    const scale = useTransform(progress, range, [1, targetScale]);

    const locationDisplay = project.location || project.city || null;
    const priceDisplay = project.min_price
        ? project.max_price
            ? `${project.min_price} – ${project.max_price}`
            : `From ${project.min_price}`
        : null;

    return (
        <div
            ref={cardRef}
            className="h-[60vh] md:h-screen flex items-center justify-center sticky top-0"
        >
            <motion.div
                style={{
                    scale,
                    top: `calc(-5vh + ${i * 25}px)`,
                    cursor: 'pointer',
                }}
                className="relative -top-[25%] w-[92%] max-w-[1200px] h-[45vh] md:h-[70vh] rounded-xl overflow-hidden shadow-2xl origin-top"
                onClick={() => checkAuthAndNavigate(project.linkTo)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Full Background Image */}
                <motion.div
                    className="absolute inset-0"
                    style={{ scale: imageScale }}
                >
                    <img
                        src={project.image}
                        alt={project.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </motion.div>

                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.08) 70%, transparent 100%)',
                    transition: 'opacity 0.3s ease',
                }} />

                {/* Top-left: Featured Project */}
                <div style={{
                    position: 'absolute', top: '1rem', left: '1rem', zIndex: 2,
                }}>
                    <span style={{
                        padding: '6px 14px', borderRadius: '2rem',
                        background: 'linear-gradient(135deg, #BFA270, #d4b886)',
                        color: '#1a1a1a', fontSize: '0.75rem', fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                        boxShadow: '0 2px 8px rgba(191,162,112,0.4)',
                        display: 'inline-block'
                    }}>
                        ✦ Featured Project
                    </span>
                </div>

                {/* Top-right: Location */}
                {locationDisplay && (
                    <div style={{
                        position: 'absolute', top: '1rem', right: '1rem', zIndex: 2,
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '2rem',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 500,
                    }}>
                        <MapPin size={11} />
                        {locationDisplay}
                    </div>
                )}

                {/* Bottom content — project name + hover details */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                    padding: '2rem',
                }}>
                    <h3 style={{
                        margin: '0 0 0.75rem', color: '#fff',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 600,
                        lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}>
                        {project.title}
                    </h3>

                    {/* Hover-reveal details */}
                    <div style={{
                        display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
                        transform: hovered ? 'translateY(0)' : 'translateY(12px)',
                        opacity: hovered ? 1 : 0,
                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: hovered ? 'auto' : 'none',
                    }}>
                        {priceDisplay && (
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Price Range</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{priceDisplay}</div>
                            </div>
                        )}
                        {project.status && (
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Status</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{project.status}</div>
                            </div>
                        )}
                        {project.developer_name && (
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Developer</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{project.developer_name}</div>
                            </div>
                        )}
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
    const { checkAuthAndNavigate } = useAuth();
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
                            color: '#183C38'
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
                        onClick={() => checkAuthAndNavigate('/properties/projects')}
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
                    .select('id, project_name, ad_card_image, location, city, developer_name, min_price, max_price, status')
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
                        location: p.location || undefined,
                        city: p.city || undefined,
                        developer_name: p.developer_name || undefined,
                        min_price: p.min_price || undefined,
                        max_price: p.max_price || undefined,
                        status: p.status || undefined,
                    }));
                    setProjects(formatted);
                    return;
                }

                // Fallback: featured projects
                const { data: featuredProjects } = await supabase
                    .from('projects')
                    .select('id, project_name, images, location, city, developer_name, min_price, max_price, status')
                    .eq('is_featured', true)
                    .limit(5);

                if (featuredProjects && featuredProjects.length > 0) {
                    const formatted: ProjectCardData[] = featuredProjects.map((p, index) => ({
                        id: p.id,
                        title: p.project_name,
                        image: p.images?.[0] || fallbackProjects[index % fallbackProjects.length].image,
                        linkTo: `/projects/${p.id}`,
                        location: p.location || undefined,
                        city: p.city || undefined,
                        developer_name: p.developer_name || undefined,
                        min_price: p.min_price || undefined,
                        max_price: p.max_price || undefined,
                        status: p.status || undefined,
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
