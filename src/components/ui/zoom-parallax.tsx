'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';

interface Image {
    src: string;
    alt?: string;
}

interface ZoomParallaxProps {
    /** Array of images to be displayed in the parallax effect max 7 images */
    images: Image[];
}

// Position configurations using transform translate for proper positioning
const imageConfigs = [
    // Index 0: CENTER - main focus image
    { translateX: '0%', translateY: '0%', height: '25vh', width: '25vw' },
    // Index 1: TOP CENTER - city street (aligned left with center image)
    { translateX: '15%', translateY: '-145%', height: '30vh', width: '35vw' },
    // Index 2: LEFT SIDE - tall image (adjusted vertical alignment)
    { translateX: '-122%', translateY: '-6%', height: '45vh', width: '20vw' },
    // Index 3: RIGHT SIDE - mountains
    { translateX: '110%', translateY: '0%', height: '25vh', width: '25vw' },
    // Index 4: BOTTOM CENTER-RIGHT (moved further down)
    { translateX: '10%', translateY: '160%', height: '20vh', width: '18vw' },
    // Index 5: BOTTOM LEFT - colorful (moved down)
    { translateX: '-80%', translateY: '140%', height: '25vh', width: '30vw' },
    // Index 6: BOTTOM RIGHT - small forest (moved further down)
    { translateX: '130%', translateY: '200%', height: '15vh', width: '15vw' },
];

export function ZoomParallax({ images }: ZoomParallaxProps) {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end end'],
    });

    const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
    const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
    const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
    const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
    const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

    const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

    // CTA overlay animations - fade in during last 30% of scroll
    const overlayOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 0.75]);
    const contentOpacity = useTransform(scrollYProgress, [0.75, 0.95], [0, 1]);
    const contentY = useTransform(scrollYProgress, [0.75, 0.95], [30, 0]);

    return (
        <div ref={container} className="relative h-[300vh]">
            <div className="sticky top-0 h-screen overflow-hidden" style={{ backgroundColor: '#F6F6F5' }}>
                {images.map(({ src, alt }, index) => {
                    const scale = scales[index % scales.length];
                    const config = imageConfigs[index % imageConfigs.length];

                    return (
                        <motion.div
                            key={index}
                            style={{ scale }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div
                                style={{
                                    height: config.height,
                                    width: config.width,
                                    transform: `translate(${config.translateX}, ${config.translateY})`,
                                }}
                            >
                                <img
                                    src={src || '/placeholder.svg'}
                                    alt={alt || `Parallax image ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </motion.div>
                    );
                })}

                {/* CTA Overlay - appears when center image is zoomed */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        opacity: overlayOpacity,
                        backgroundColor: 'rgba(43, 54, 66, 0.8)'
                    }}
                />

                {/* CTA Content */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ opacity: contentOpacity }}
                >
                    <div className="text-center px-8 max-w-[600px]">
                        <motion.p
                            style={{ y: contentY, color: '#BFA270' }}
                            className="text-[0.75rem] font-normal tracking-[0.2em] uppercase mb-4"
                        >
                            Let&apos;s Connect
                        </motion.p>

                        <motion.h2
                            style={{ y: contentY, color: '#ffffff' }}
                            className="font-serif text-[clamp(2rem,5vw,3rem)] font-medium tracking-[-0.02em] mb-4"
                        >
                            Begin Your Journey
                        </motion.h2>

                        <motion.p
                            style={{ y: contentY, color: 'rgba(255, 255, 255, 0.8)' }}
                            className="text-[0.9375rem] leading-[1.7] mb-8"
                        >
                            Whether you&apos;re buying your first home or expanding your portfolio,
                            our team is here to guide you with transparency and expertise.
                        </motion.p>

                        <motion.div
                            className="flex justify-center"
                            style={{ y: contentY }}
                        >
                            <motion.a
                                href="mailto:hello@27estates.com"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.875rem 1.75rem',
                                    backgroundColor: '#1F524B',
                                    color: '#ffffff',
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase' as const,
                                    textDecoration: 'none',
                                    border: '1px solid #1F524B',
                                    transition: 'all 0.3s ease'
                                }}
                                className="hover:bg-[#2d7a6e] hover:border-[#2d7a6e] hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(31,82,75,0.4)]"
                                whileHover={{ y: -2 }}
                            >
                                Contact Us
                            </motion.a>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

