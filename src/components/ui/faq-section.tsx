'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PhoneCall } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
    {
        question: 'What locations does 27 Estates cover?',
        answer: 'We operate across all major cities in India including Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, and Goa. Our network spans premium localities in each city, covering both established neighborhoods and emerging investment corridors nationwide.',
    },
    {
        question: 'What types of properties do you deal with?',
        answer: 'We specialize in luxury apartments, premium villas, residential plots, commercial office spaces, and warehouse & logistics properties. Whether you\'re looking for a family home, investment property, or commercial space, we have curated options across all segments.',
    },
    {
        question: 'How do I know if a property is RERA registered?',
        answer: 'Every property we list is verified for RERA compliance. You can also check registration status on the Karnataka RERA portal (rera.karnataka.gov.in). Our team provides complete documentation including RERA numbers, approvals, and title verification reports before any transaction.',
    },
    {
        question: 'What is the process for buying a property through 27 Estates?',
        answer: 'Our process includes: an initial consultation to understand your needs, curated property shortlisting, accompanied site visits, due diligence and legal verification, negotiation support, documentation assistance, and post-purchase support including registration and possession.',
    },
    {
        question: 'Do you assist with home loans and financing?',
        answer: 'Yes, we have partnerships with leading banks and financial institutions. Our team helps you compare loan options, optimize tenure and EMI, and maximize tax benefits under Sections 24, 80C, and 80EEA. We also assist with pre-approval to strengthen your buying position.',
    },
    {
        question: 'Can NRIs purchase property through 27 Estates?',
        answer: 'Absolutely. We have extensive experience assisting NRI clients with property purchases. We handle everything from Power of Attorney documentation to NRE/NRO account coordination, and ensure full compliance with FEMA regulations and repatriation requirements.',
    },
    {
        question: 'What are your fees and how are you compensated?',
        answer: 'Our brokerage is competitive and transparent. For residential purchases, we typically charge 1-2% of the transaction value. For commercial leasing, it\'s usually one month\'s rent. There are no hidden charges, and our fee structure is discussed upfront before engagement.',
    },
    {
        question: 'How do you determine property valuations?',
        answer: 'We use a comprehensive approach combining recent comparable transactions, location analysis, infrastructure development impact, builder reputation, amenity benchmarking, and market trend data. Our valuations are backed by research and help clients make informed decisions.',
    },
];

function FAQ() {
    return (
        <section style={{ padding: '5rem 0', backgroundColor: '#ffffff' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '4rem',
                    alignItems: 'start',
                }}>
                    {/* Left Column - Header */}
                    <div style={{ textAlign: 'center' }}>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6 }}
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#BFA270',
                                marginBottom: '1rem',
                            }}
                        >
                            FAQ
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                                fontWeight: 500,
                                letterSpacing: '-0.02em',
                                color: '#1F524B',
                                marginBottom: '1.25rem',
                                lineHeight: 1.2,
                            }}
                        >
                            Frequently Asked Questions
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '1.0625rem',
                                lineHeight: 1.7,
                                color: '#0E110F',
                                opacity: 0.8,
                                maxWidth: '500px',
                                margin: '0 auto 2rem',
                            }}
                        >
                            Everything you need to know about buying, selling, and investing in premium real estate with 27 Estates.
                        </motion.p>
                        <motion.a
                            href="tel:+919844653113"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.875rem 1.75rem',
                                border: '1px solid #1F524B',
                                borderRadius: '4px',
                                color: '#1F524B',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Can&apos;t find your answer? Call us <PhoneCall size={16} />
                        </motion.a>
                    </div>

                    {/* Right Column - Accordion */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}
                    >
                        <Accordion type="single" collapsible className="w-full">
                            {faqItems.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    value={'index-' + index}
                                    style={{ borderColor: 'rgba(43, 54, 66, 0.1)' }}
                                >
                                    <AccordionTrigger
                                        className="hover:no-underline"
                                        style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.125rem',
                                            fontWeight: 500,
                                            color: '#1F524B',
                                            textAlign: 'left',
                                            padding: '1.25rem 0',
                                        }}
                                    >
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.9375rem',
                                            lineHeight: 1.7,
                                            color: '#0E110F',
                                            opacity: 0.75,
                                        }}
                                    >
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export { FAQ };
