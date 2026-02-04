'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';
import Section from '@/components/ui/Section';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
    return (
        <PageTransition>
            <main className="min-h-screen bg-white">
                <Navigation />

                {/* Hero Section */}
                <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center bg-[#f5f4f3] pt-20">
                    <div className="container mx-auto px-4 text-center z-10">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-[var(--dark-turquoise)] font-medium tracking-widest uppercase mb-4"
                        >
                            Get in Touch
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-5xl md:text-7xl font-heading font-medium text-[var(--dark-grey)]"
                        >
                            Let's Start a Conversation
                        </motion.h1>
                    </div>
                </div>

                {/* Content Section */}
                <Section className="bg-white -mt-20 relative z-20 rounded-t-[3rem] shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

                        {/* Contact Info & Map */}
                        <div className="space-y-12">
                            <div>
                                <h2 className="text-3xl font-heading text-[var(--dark-grey)] mb-6">Visit Our Office</h2>
                                <p className="text-gray-600 leading-relaxed mb-8">
                                    Experience luxury real estate consulting in person. Our headquarters reflects our commitment to excellence and comfort.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center flex-shrink-0">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--dark-grey)] mb-1">Headquarters</h3>
                                            <p className="text-gray-500">123 Luxury Lane, Indiranagar<br />Bangalore, KA 560038</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center flex-shrink-0">
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--dark-grey)] mb-1">Phone</h3>
                                            <p className="text-gray-500">+91 987 654 3210</p>
                                            <p className="text-gray-500 text-sm">Mon-Fri, 9am - 6pm</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center flex-shrink-0">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--dark-grey)] mb-1">Email</h3>
                                            <p className="text-gray-500">hello@21estates.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="w-full h-[300px] bg-gray-100 rounded-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                    <p className="text-gray-400 font-medium tracking-wide">INTERACTIVE MAP LOADING</p>
                                </div>
                                <div className="absolute inset-0 bg-[var(--dark-turquoise)]/0 group-hover:bg-[var(--dark-turquoise)]/5 transition-colors duration-500 cursor-pointer" />
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-[#f9f9f9] p-8 md:p-12 rounded-3xl">
                            <h2 className="text-3xl font-heading text-[var(--dark-grey)] mb-2">Send a Message</h2>
                            <p className="text-gray-500 mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--dark-grey)] uppercase tracking-wide">First Name</label>
                                        <input type="text" className="w-full bg-white border-0 border-b border-gray-300 focus:border-[var(--dark-turquoise)] px-0 py-3 transition-colors outline-none text-[var(--dark-grey)]" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--dark-grey)] uppercase tracking-wide">Last Name</label>
                                        <input type="text" className="w-full bg-white border-0 border-b border-gray-300 focus:border-[var(--dark-turquoise)] px-0 py-3 transition-colors outline-none text-[var(--dark-grey)]" placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--dark-grey)] uppercase tracking-wide">Email Address</label>
                                    <input type="email" className="w-full bg-white border-0 border-b border-gray-300 focus:border-[var(--dark-turquoise)] px-0 py-3 transition-colors outline-none text-[var(--dark-grey)]" placeholder="john@example.com" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--dark-grey)] uppercase tracking-wide">Phone Number</label>
                                    <input type="tel" className="w-full bg-white border-0 border-b border-gray-300 focus:border-[var(--dark-turquoise)] px-0 py-3 transition-colors outline-none text-[var(--dark-grey)]" placeholder="+91 99999 99999" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--dark-grey)] uppercase tracking-wide">Message</label>
                                    <textarea className="w-full bg-white border-0 border-b border-gray-300 focus:border-[var(--dark-turquoise)] px-0 py-3 transition-colors outline-none text-[var(--dark-grey)] min-h-[120px] resize-y" placeholder="Tell us about your requirements..." />
                                </div>

                                <button className="w-full bg-[var(--dark-turquoise)] text-white py-4 rounded-xl uppercase tracking-widest font-medium hover:bg-[#1a4640] transition-colors duration-300 shadow-lg shadow-[var(--dark-turquoise)]/30 mt-4">
                                    Send Message
                                </button>
                            </form>
                        </div>

                    </div>
                </Section>

                <Footer />
            </main>
        </PageTransition>
    );
}
