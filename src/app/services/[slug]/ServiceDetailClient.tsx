'use client';

import { services } from "@/lib/services-data";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, TrendingUp, Building2, ChevronDown, ArrowLeft } from "lucide-react";

interface ServiceDetailClientProps {
    slug: string;
}

export default function ServiceDetailClient({ slug }: ServiceDetailClientProps) {
    const service = services.find((s) => s.slug === slug);
    const containerRef = useRef(null);
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    const [openFaq, setOpenFaq] = useState<number | null>(null);

    if (!service) {
        notFound();
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Get other services for "More Services" section
    const otherServices = services.filter(s => s.id !== service.id).slice(0, 3);

    return (
            <main ref={containerRef} className="min-h-screen bg-white">
                <Navigation />

                {/* Sticky Hero - content scrolls over it */}
                <section ref={heroRef} style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 0,
                    height: '70vh',
                    minHeight: '500px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'var(--dark-grey, #0E110F)',
                }}>
                    {/* Background with parallax */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '120%',
                            y: heroY,
                        }}
                    >
                        <Image
                            src={service.heroImage}
                            alt={service.title}
                            fill
                            priority
                            className="object-cover"
                        />
                    </motion.div>

                    {/* Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)',
                        zIndex: 1,
                    }} />

                    {/* Hero Content - fades out on scroll */}
                    <motion.div style={{
                        position: 'relative',
                        zIndex: 2,
                        textAlign: 'center',
                        color: '#fff',
                        maxWidth: '900px',
                        padding: '0 2rem',
                        opacity: heroOpacity,
                    }}>

                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            style={{
                                display: 'inline-block',
                                padding: '6px 18px',
                                border: '1px solid var(--gold, #BFA270)',
                                color: 'var(--gold, #BFA270)',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                marginBottom: '2rem',
                                backdropFilter: 'blur(8px)',
                                backgroundColor: 'rgba(31, 82, 75, 0.4)',
                            }}
                        >
                            {service.title}
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                                fontWeight: 500,
                                lineHeight: 1.15,
                                marginBottom: '2rem',
                                letterSpacing: '-0.02em',
                                color: '#FFFFFF',
                            }}
                        >
                            {service.heroTitle}
                        </motion.h1>

                    </motion.div>

                </section>

                {/* All content after hero - single wrapper so hero never peeks through */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: '#fff',
                }}>

                {/* Overview Section - scrolls over sticky hero */}
                <section style={{
                    padding: '6rem 0',
                    backgroundColor: '#fff',
                    paddingTop: '6rem',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
                }}>
                    <div className="container mx-auto px-4">
                        {/* Back Link positioned in content */}
                        <div style={{ marginBottom: '2rem' }}>
                            <Link
                                href="/services"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: 'var(--dark-grey, #0E110F)',
                                    textDecoration: 'none',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    transition: 'color 0.3s',
                                    opacity: 0.6,
                                }}
                                className="hover:opacity-100 hover:text-[var(--dark-turquoise)]"
                            >
                                <ArrowLeft size={13} style={{ marginRight: '8px' }} />
                                All Services
                            </Link>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '4rem',
                            maxWidth: '1200px',
                            margin: '0 auto',
                        }} className="lg:!grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7 }}
                            >
                                <p style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    color: 'var(--gold, #BFA270)',
                                    marginBottom: '1rem',
                                }}>
                                    Overview
                                </p>
                                <h2 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                                    fontWeight: 500,
                                    color: 'var(--dark-turquoise, #183C38)',
                                    lineHeight: 1.4,
                                    letterSpacing: '-0.02em',
                                    marginBottom: '1.5rem',
                                }}>
                                    {service.overview}
                                </h2>
                                <p style={{
                                    fontSize: '1.05rem',
                                    lineHeight: 1.8,
                                    color: '#666',
                                }}>
                                    {service.detailedDescription}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                style={{ position: 'relative' }}
                            >
                                <div style={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    aspectRatio: '4/3',
                                    position: 'relative',
                                }}>
                                    <Image
                                        src={service.featuredImage}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Capabilities Section */}
                <section id="capabilities" style={{ padding: '6rem 0', backgroundColor: '#f9f6f3' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center', marginBottom: '4rem' }}
                        >
                            <p style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: 'var(--gold, #BFA270)',
                                marginBottom: '1rem',
                            }}>
                                What We Do
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                                fontWeight: 500,
                                color: 'var(--dark-turquoise, #183C38)',
                                letterSpacing: '-0.02em',
                            }}>
                                Our Capabilities
                            </h2>
                        </motion.div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                            gap: '1.25rem',
                        }}>
                            {service.serviceList.map((item, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.25rem',
                                        padding: '1.5rem 2rem',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: '1px solid #f0ece7',
                                        transition: 'all 0.3s',
                                    }}
                                    className="hover:border-[var(--dark-turquoise)] hover:shadow-lg group"
                                >
                                    <span style={{
                                        flexShrink: 0,
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s',
                                    }}
                                        className="bg-[var(--dark-turquoise)]/10 text-[var(--dark-turquoise)] group-hover:bg-[var(--dark-turquoise)] group-hover:text-white"
                                    >
                                        <Check size={18} strokeWidth={2.5} />
                                    </span>
                                    <p style={{
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        color: 'var(--dark-grey, #0E110F)',
                                    }}>
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Process Section */}
                <section style={{ padding: '6rem 0', backgroundColor: '#fff' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center', marginBottom: '4rem' }}
                        >
                            <p style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: 'var(--gold, #BFA270)',
                                marginBottom: '1rem',
                            }}>
                                How We Work
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                                fontWeight: 500,
                                color: 'var(--dark-turquoise, #183C38)',
                                letterSpacing: '-0.02em',
                            }}>
                                Our Process
                            </h2>
                        </motion.div>

                        <div style={{ position: 'relative' }}>
                            {/* Vertical line */}
                            <div style={{
                                position: 'absolute',
                                left: '24px',
                                top: '24px',
                                bottom: '24px',
                                width: '1px',
                                backgroundColor: '#e5e1dc',
                            }} className="hidden lg:block" />

                            {service.process.map((step, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        gap: '2rem',
                                        marginBottom: idx < service.process.length - 1 ? '2.5rem' : 0,
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{
                                        flexShrink: 0,
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--dark-turquoise, #183C38)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        position: 'relative',
                                        zIndex: 2,
                                    }}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div style={{ paddingTop: '8px' }}>
                                        <h3 style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.3rem',
                                            fontWeight: 500,
                                            color: 'var(--dark-turquoise, #183C38)',
                                            marginBottom: '0.5rem',
                                        }}>
                                            {step.title}
                                        </h3>
                                        <p style={{
                                            fontSize: '0.95rem',
                                            lineHeight: 1.7,
                                            color: '#777',
                                        }}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section style={{ padding: '6rem 0', backgroundColor: '#f9f6f3' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center', marginBottom: '4rem' }}
                        >
                            <p style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: 'var(--gold, #BFA270)',
                                marginBottom: '1rem',
                            }}>
                                Advantages
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                                fontWeight: 500,
                                color: 'var(--dark-turquoise, #183C38)',
                                letterSpacing: '-0.02em',
                            }}>
                                Why Work With Us
                            </h2>
                        </motion.div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '1.5rem',
                        }}>
                            {service.benefits.map((benefit, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '16px',
                                        padding: '2.5rem 2rem',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.4s',
                                    }}
                                    className="hover:shadow-xl group"
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '3px',
                                        background: 'linear-gradient(90deg, var(--gold, #BFA270), var(--dark-turquoise, #183C38))',
                                        opacity: 0,
                                        transition: 'opacity 0.4s',
                                    }} className="group-hover:!opacity-100" />
                                    <h3 style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: '1.25rem',
                                        fontWeight: 500,
                                        color: 'var(--dark-turquoise, #183C38)',
                                        marginBottom: '0.75rem',
                                    }}>
                                        {benefit.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        lineHeight: 1.7,
                                        color: '#888',
                                    }}>
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Market Insights Section */}
                <section id="insights" style={{ padding: '6rem 0', backgroundColor: '#fff' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ marginBottom: '3rem' }}
                        >
                            <p style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: 'var(--gold, #BFA270)',
                                marginBottom: '1rem',
                            }}>
                                Market Data
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                                fontWeight: 500,
                                color: 'var(--dark-turquoise, #183C38)',
                                letterSpacing: '-0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                            }}>
                                <TrendingUp style={{ color: 'var(--gold, #BFA270)' }} />
                                Market Intelligence
                            </h2>
                        </motion.div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {service.insights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '2rem 2.5rem',
                                        backgroundColor: '#f9f6f3',
                                        borderRadius: '12px',
                                        borderLeft: '3px solid var(--gold, #BFA270)',
                                        transition: 'all 0.4s',
                                    }}
                                    className="hover:bg-[var(--dark-turquoise)] hover:text-white hover:border-l-white group"
                                >
                                    <p style={{
                                        fontSize: '1rem',
                                        lineHeight: 1.7,
                                        fontWeight: 450,
                                        transition: 'color 0.4s',
                                    }}
                                        className="text-[var(--dark-grey)] group-hover:text-white"
                                    >
                                        {insight}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section style={{
                    padding: '6rem 0',
                    backgroundColor: 'var(--dark-turquoise, #183C38)',
                }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
                        >
                            <p style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: 'var(--gold, #BFA270)',
                                marginBottom: '1rem',
                            }}>
                                Our Edge
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                                fontWeight: 500,
                                color: '#fff',
                                letterSpacing: '-0.02em',
                            }}>
                                Why 27 Estates
                            </h2>
                        </motion.div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {service.whyChooseUs.map((reason, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1.25rem',
                                        padding: '1.5rem 2rem',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <span style={{
                                        flexShrink: 0,
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--gold, #BFA270)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '2px',
                                    }}>
                                        <Check size={16} color="#fff" strokeWidth={2.5} />
                                    </span>
                                    <p style={{
                                        fontSize: '1rem',
                                        lineHeight: 1.6,
                                        color: 'rgba(255,255,255,0.85)',
                                    }}>
                                        {reason}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section style={{ padding: '6rem 0', backgroundColor: '#f9f6f3' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
                        >
                            <p style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: 'var(--gold, #BFA270)',
                                marginBottom: '1rem',
                            }}>
                                Questions
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                                fontWeight: 500,
                                color: 'var(--dark-turquoise, #183C38)',
                                letterSpacing: '-0.02em',
                            }}>
                                Frequently Asked Questions
                            </h2>
                        </motion.div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {service.faqs.map((faq, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid #f0ece7',
                                    }}
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1.5rem 2rem',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.05rem',
                                            fontWeight: 500,
                                            color: 'var(--dark-turquoise, #183C38)',
                                            paddingRight: '1rem',
                                        }}>
                                            {faq.question}
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            style={{
                                                flexShrink: 0,
                                                color: 'var(--gold, #BFA270)',
                                                transition: 'transform 0.3s',
                                                transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }}
                                        />
                                    </button>
                                    <div style={{
                                        maxHeight: openFaq === idx ? '300px' : '0',
                                        overflow: 'hidden',
                                        transition: 'max-height 0.4s ease',
                                    }}>
                                        <p style={{
                                            padding: '0 2rem 1.5rem',
                                            fontSize: '0.95rem',
                                            lineHeight: 1.7,
                                            color: '#777',
                                        }}>
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact Form Section */}
                <section id="contact-form" style={{ padding: '6rem 0', backgroundColor: '#fff' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '4rem',
                            alignItems: 'center',
                        }} className="lg:!grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <p style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    color: 'var(--gold, #BFA270)',
                                    marginBottom: '1rem',
                                }}>
                                    Get Started
                                </p>
                                <h2 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
                                    fontWeight: 500,
                                    color: 'var(--dark-turquoise, #183C38)',
                                    letterSpacing: '-0.02em',
                                    marginBottom: '1.5rem',
                                }}>
                                    Partner With Us
                                </h2>
                                <p style={{
                                    fontSize: '1.05rem',
                                    lineHeight: 1.7,
                                    color: '#777',
                                    marginBottom: '2rem',
                                }}>
                                    Ready to get expert advice for your {service.title.toLowerCase()} needs? Our consultants are ready to help you make informed decisions.
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    color: 'var(--dark-turquoise, #183C38)',
                                }}>
                                    <Building2 size={20} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        27 Estates Advisory
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <div style={{
                                    backgroundColor: '#f9f6f3',
                                    borderRadius: '20px',
                                    padding: '2.5rem',
                                }}>
                                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.9rem 1.25rem',
                                                    backgroundColor: '#fff',
                                                    border: '1px solid transparent',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    outline: 'none',
                                                    transition: 'border-color 0.3s',
                                                }}
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.9rem 1.25rem',
                                                    backgroundColor: '#fff',
                                                    border: '1px solid transparent',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    outline: 'none',
                                                    transition: 'border-color 0.3s',
                                                }}
                                            />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            style={{
                                                width: '100%',
                                                padding: '0.9rem 1.25rem',
                                                backgroundColor: '#fff',
                                                border: '1px solid transparent',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                transition: 'border-color 0.3s',
                                            }}
                                        />
                                        <textarea
                                            placeholder="Tell us about your requirements..."
                                            style={{
                                                width: '100%',
                                                padding: '0.9rem 1.25rem',
                                                backgroundColor: '#fff',
                                                border: '1px solid transparent',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                height: '120px',
                                                resize: 'none',
                                                transition: 'border-color 0.3s',
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                backgroundColor: 'var(--dark-turquoise, #183C38)',
                                                color: '#fff',
                                                border: 'none',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s',
                                                borderRadius: '4px',
                                            }}
                                            className="hover:bg-[#1a4640]"
                                        >
                                            {service.ctaTitle}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* More Services Section */}
                <section style={{ padding: '6rem 0', backgroundColor: '#f9f6f3', borderTop: '1px solid #f0ece7' }}>
                    <div className="container mx-auto px-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'space-between',
                                marginBottom: '3rem',
                            }}
                        >
                            <div>
                                <p style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    color: 'var(--gold, #BFA270)',
                                    marginBottom: '0.75rem',
                                }}>
                                    Explore More
                                </p>
                                <h2 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                                    fontWeight: 500,
                                    color: 'var(--dark-turquoise, #183C38)',
                                    letterSpacing: '-0.02em',
                                }}>
                                    Other Services
                                </h2>
                            </div>
                            <Link
                                href="/services"
                                style={{
                                    display: 'none',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    color: 'var(--dark-turquoise, #183C38)',
                                    textDecoration: 'none',
                                    transition: 'color 0.3s',
                                }}
                                className="md:!inline-flex hover:text-[var(--gold)]"
                            >
                                View All <ArrowRight size={14} style={{ marginLeft: '8px' }} />
                            </Link>
                        </motion.div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1.5rem',
                        }}>
                            {otherServices.map((s, idx) => (
                                <div
                                    key={s.id}
                                >
                                    <Link
                                        href={`/services/${s.slug}`}
                                        style={{ display: 'block', textDecoration: 'none' }}
                                        className="group"
                                    >
                                        <div style={{
                                            position: 'relative',
                                            aspectRatio: '16/9',
                                            overflow: 'hidden',
                                            borderRadius: '12px',
                                            marginBottom: '1.25rem',
                                        }}>
                                            <Image
                                                src={s.image}
                                                alt={s.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                                            }} />
                                        </div>
                                        <h3 style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.35rem',
                                            fontWeight: 500,
                                            color: 'var(--dark-grey, #0E110F)',
                                            marginBottom: '0.5rem',
                                            transition: 'color 0.3s',
                                        }}
                                            className="group-hover:text-[var(--gold)]"
                                        >
                                            {s.title}
                                        </h3>
                                        <p style={{
                                            fontSize: '0.9rem',
                                            color: '#888',
                                            lineHeight: 1.6,
                                        }}>
                                            {s.description}
                                        </p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <Footer />
                </div>
            </main>
    );
}
