'use client';

import React, { useState } from 'react';
import Preloader from '@/components/Preloader';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import WelcomeSection from '@/components/WelcomeSection';
import ServicesSection from '@/components/ServicesSection';
import FeaturedProperties from '@/components/FeaturedProperties';
import FeaturedProjectsStacked from '@/components/FeaturedProjectsStacked';
import HowWeWork from '@/components/HowWeWork';
import TestimonialSection from '@/components/TestimonialSection';
import BlogCards from '@/components/ui/blogs';
import GalleryShowcase from '@/components/GalleryShowcase';
import Footer from '@/components/Footer';


export default function Home() {
    const [loading, setLoading] = useState(true);

    return (
        <>
            {loading && <Preloader onComplete={() => setLoading(false)} />}

            {!loading && (
                <main>
                    <Navigation />
                    <Hero />
                    <div style={{ position: 'relative', zIndex: 10, backgroundColor: 'var(--background)' }}>
                        <WelcomeSection />
                        <ServicesSection />
                        <FeaturedProjectsStacked />
                        <FeaturedProperties />
                        <HowWeWork />
                        <TestimonialSection />
                        <BlogCards />
                        <GalleryShowcase />
                        <Footer />
                    </div>

                </main>
            )}
        </>
    );
}


