"use client";

import { useState } from "react";
import { services } from "@/lib/services-data";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExpandOnHover = () => {
    const [startIndex, setStartIndex] = useState(0);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const visibleCount = 3;

    // Get 3 visible services in a cyclic manner
    const getVisibleServices = () => {
        const visible = [];
        for (let i = 0; i < visibleCount; i++) {
            visible.push(services[(startIndex + i) % services.length]);
        }
        return visible;
    };

    const visibleServices = getVisibleServices();

    const handleNext = () => {
        setStartIndex((prev) => (prev + 1) % services.length);
        setExpandedIndex(0);
    };

    const handlePrev = () => {
        setStartIndex((prev) => (prev - 1 + services.length) % services.length);
        setExpandedIndex(0);
    };

    const getCardWidth = (index: number) => {
        return index === expandedIndex ? "flex-[2]" : "flex-1";
    };

    return (
        <section className="w-full bg-[#f5f4f3] pb-24">
            <div className="w-full px-16">
                {/* Carousel Container */}
                <div className="flex items-center gap-4 justify-center">
                    {/* Left Navigation */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        className="rounded-2xl bg-white border border-gray-200 text-[var(--dark-turquoise)] hover:bg-[var(--dark-turquoise)]/10 hover:text-[var(--dark-turquoise)] hover:border-[var(--dark-turquoise)]/50 transition-all duration-300 flex-shrink-0 z-50 h-[48px] w-[48px] shadow-lg"
                        aria-label="Previous Service"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </Button>

                    {/* Cards */}
                    <div className="flex h-[60vh] min-h-[500px] flex-1">
                        {visibleServices.map((service, idx) => {
                            const isExpanded = idx === expandedIndex;
                            return (
                                <div
                                    key={`${service.id}-${startIndex}`}
                                    className={`relative cursor-pointer overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] h-full ${getCardWidth(idx)}`}
                                    onMouseEnter={() => setExpandedIndex(idx)}
                                    style={{ position: 'relative' }}
                                >
                                    {/* Image - Must fill entire card */}
                                    <img
                                        className="transition-all duration-700 ease-out"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center',
                                            transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
                                        }}
                                        src={service.image}
                                        alt={service.title}
                                    />

                                    {/* Overlay */}
                                    <div
                                        className="transition-all duration-500 pointer-events-none"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: isExpanded ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
                                        }}
                                    />

                                    {/* Content - Only when expanded */}
                                    {isExpanded && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                                            <h3
                                                className="text-white text-3xl font-medium mb-3"
                                                style={{ color: '#ffffff', textShadow: '0 2px 10px black' }}
                                            >
                                                {service.title}
                                            </h3>
                                            <p
                                                className="text-white text-base max-w-[280px]"
                                                style={{ color: '#ffffff', textShadow: '0 1px 5px black' }}
                                            >
                                                {service.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Navigation */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        className="rounded-2xl bg-white border border-gray-200 text-[var(--dark-turquoise)] hover:bg-[var(--dark-turquoise)]/10 hover:text-[var(--dark-turquoise)] hover:border-[var(--dark-turquoise)]/50 transition-all duration-300 flex-shrink-0 z-50 h-[48px] w-[48px] shadow-lg"
                        aria-label="Next Service"
                    >
                        <ChevronRight size={24} strokeWidth={2.5} />
                    </Button>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-3" style={{ marginTop: '48px' }}>
                    {services.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setStartIndex(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 border-[1.5px] ${idx === startIndex
                                ? 'bg-[var(--dark-turquoise)] border-[var(--dark-turquoise)] scale-125'
                                : 'bg-transparent border-gray-400 hover:border-[var(--dark-turquoise)]'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ExpandOnHover;
