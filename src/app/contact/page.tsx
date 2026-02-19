'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

import { Contact2 } from '@/components/ui/contact-2';
import { FAQ } from '@/components/ui/faq-section';
import PageHero from '@/components/PageHero';

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navigation alwaysScrolled={false} />

            {/* Hero Section */}
            <PageHero
                title="Let's Start a Conversation"
                subtitle="Get in Touch"
                backgroundImage="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069"
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
                <Contact2
                    title="Reach Out"
                    description="Whether you're looking to buy, sell, or invest in premium real estate, our team is here to guide you every step of the way."
                    phone="+91 80957 99929"
                    email="connect@27estates.com"
                />

                <FAQ />

                <Footer />
            </div>
        </main>
    );
}
