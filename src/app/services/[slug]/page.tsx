'use client';

import { services } from "@/lib/services-data";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageTransition from "@/components/ui/PageTransition";
import Section from "@/components/ui/Section";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Check, ArrowRight, TrendingUp, Building2, User } from "lucide-react";

interface ServicePageProps {
    params: {
        slug: string;
    };
}

export function generateStaticParams() {
    return services.map((service) => ({
        slug: service.slug,
    }));
}

export default function ServiceDetailPage({ params }: ServicePageProps) {
    const service = services.find((s) => s.slug === params.slug);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    if (!service) {
        notFound();
    }

    // Scroll to section handler
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <PageTransition>
            <main ref={containerRef} className="min-h-screen bg-white">
                <Navigation />

                {/* Parallax Hero */}
                <div className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                    <motion.div
                        className="absolute inset-0 z-0"
                        style={{ y, opacity }}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-110"
                            style={{ backgroundImage: `url(${service.heroImage})` }}
                        />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </motion.div>

                    <div className="relative container mx-auto px-4 text-center text-white z-10 pt-20">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-block py-1 px-3 border border-white/30 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm"
                        >
                            {service.title}
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-heading font-medium mb-8 leading-tight"
                        >
                            {service.heroTitle}
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <button
                                onClick={() => scrollToSection('contact-form')}
                                className="bg-[var(--dark-turquoise)] hover:bg-white hover:text-[var(--dark-turquoise)] text-white px-10 py-4 rounded-full uppercase tracking-wider text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-1"
                            >
                                {service.heroCta}
                            </button>
                        </motion.div>
                    </div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
                    >
                        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
                        <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
                            <motion.div
                                animate={{ y: [0, 50] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 left-0 w-full h-1/2 bg-white"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Content Section with Sticky Sidebar */}
                <div className="container mx-auto px-4 py-24 lg:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                        {/* Sidebar Navigation (Sticky) */}
                        <div className="lg:col-span-3 hidden lg:block">
                            <div className="sticky top-32 space-y-8">
                                <div className="space-y-4 border-l-2 border-gray-100 pl-6">
                                    <button
                                        onClick={() => scrollToSection('capabilities')}
                                        className="block text-sm font-medium text-gray-400 hover:text-[var(--dark-turquoise)] transition-colors text-left uppercase tracking-wide"
                                    >
                                        Capabilities
                                    </button>
                                    <button
                                        onClick={() => scrollToSection('insights')}
                                        className="block text-sm font-medium text-gray-400 hover:text-[var(--dark-turquoise)] transition-colors text-left uppercase tracking-wide"
                                    >
                                        Market Insights
                                    </button>
                                    <button
                                        onClick={() => scrollToSection('contact-form')}
                                        className="block text-sm font-medium text-gray-400 hover:text-[var(--dark-turquoise)] transition-colors text-left uppercase tracking-wide"
                                    >
                                        Inquire
                                    </button>
                                </div>

                                <div className="p-6 bg-[#f5f4f3] rounded-2xl">
                                    <h4 className="font-heading text-lg mb-2">Need Expert Advice?</h4>
                                    <p className="text-sm text-gray-500 mb-4">Our consultants are ready to assist with your {service.title} needs.</p>
                                    <button
                                        onClick={() => scrollToSection('contact-form')}
                                        className="text-[var(--dark-turquoise)] text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all"
                                    >
                                        Contact Us <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-6">
                            {/* Capabilities */}
                            <Section id="capabilities" className="!p-0 !py-0 mb-32">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <h2 className="text-3xl md:text-4xl font-heading text-[var(--dark-grey)] mb-6">Execution Excellence</h2>
                                    <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                                        We deliver comprehensive strategies tailored to your unique requirements, ensuring maximum value and minimal risk.
                                    </p>

                                    <div className="space-y-6">
                                        {service.serviceList.map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="flex items-start group p-6 rounded-2xl bg-white border border-gray-100 hover:border-[var(--dark-turquoise)] hover:shadow-lg transition-all duration-300"
                                            >
                                                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] flex items-center justify-center mr-6 group-hover:bg-[var(--dark-turquoise)] group-hover:text-white transition-colors duration-300">
                                                    <Check size={20} strokeWidth={2.5} />
                                                </span>
                                                <div>
                                                    <h3 className="text-xl font-heading text-[var(--dark-grey)] mb-2">{item}</h3>
                                                    <p className="text-gray-500 text-sm">Professional advisory and execution support.</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </Section>

                            {/* Insights */}
                            <Section id="insights" className="!p-0 !py-0 mb-32">
                                <h2 className="text-3xl md:text-4xl font-heading text-[var(--dark-grey)] mb-12 flex items-center gap-4">
                                    <TrendingUp className="text-[var(--dark-turquoise)]" /> Market Intelligence
                                </h2>
                                <div className="grid grid-cols-1 gap-6">
                                    {service.insights.map((insight, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-[#f5f4f3] p-8 rounded-2xl hover:bg-[var(--dark-turquoise)] hover:text-white transition-all duration-500 group cursor-default"
                                        >
                                            <p className="text-lg font-medium text-[var(--dark-grey)] group-hover:text-white transition-colors leading-relaxed">
                                                {insight}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </Section>
                        </div>

                        {/* Right Form Sidebar (Sticky) */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-32">
                                <div id="contact-form" className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6 text-[var(--dark-turquoise)]">
                                        <Building2 size={24} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Connect</span>
                                    </div>
                                    <h3 className="text-2xl font-heading text-[var(--dark-grey)] mb-2">
                                        Partner with Us
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-8">
                                        Expert advice for {service.title}.
                                    </p>
                                    <form className="space-y-4">
                                        <div>
                                            <input type="text" className="w-full px-4 py-3 bg-[#f9f9f9] border border-transparent rounded-lg focus:bg-white focus:border-[var(--dark-turquoise)] focus:outline-none text-sm transition-all" placeholder="Your Name" />
                                        </div>
                                        <div>
                                            <input type="email" className="w-full px-4 py-3 bg-[#f9f9f9] border border-transparent rounded-lg focus:bg-white focus:border-[var(--dark-turquoise)] focus:outline-none text-sm transition-all" placeholder="Email Address" />
                                        </div>
                                        <div>
                                            <textarea className="w-full px-4 py-3 bg-[#f9f9f9] border border-transparent rounded-lg focus:bg-white focus:border-[var(--dark-turquoise)] focus:outline-none text-sm h-32 resize-none transition-all" placeholder="How can we help?" />
                                        </div>
                                        <button className="w-full bg-[var(--dark-turquoise)] text-white py-3 rounded-lg font-bold uppercase tracking-wide text-xs hover:bg-[#1a4640] transition-colors shadow-lg shadow-[var(--dark-turquoise)]/20">
                                            {service.ctaTitle}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <Footer />
            </main>
        </PageTransition>
    );
}
