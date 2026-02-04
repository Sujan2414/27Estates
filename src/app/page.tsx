'use client';

import React, { useState } from 'react';
import Preloader from '@/components/Preloader';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import WelcomeSection from '@/components/WelcomeSection';
import ServicesSection from '@/components/ServicesSection';
import FeaturedProperties from '@/components/FeaturedProperties';
import FeaturedProjects from '@/components/emergent/FeaturedProjects';
import TestimonialSection from '@/components/TestimonialSection';
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
                    <WelcomeSection />
                    <ServicesSection />
                    <FeaturedProperties />
                    <FeaturedProjects />
                    <TestimonialSection />
                    <GalleryShowcase />
                    <Footer />
                </main>
            )}
        </>
    );
}


