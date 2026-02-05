'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FlowButtonProps {
    text?: string;
    href?: string;
    variant?: 'primary' | 'secondary' | 'light';
    onClick?: () => void;
    className?: string;
}

export function FlowButton({
    text = "Learn More",
    href,
    variant = 'primary',
    onClick,
    className = ''
}: FlowButtonProps) {
    // Color schemes based on variant
    const colors = {
        primary: {
            border: 'var(--dark-turquoise, #1F524B)',
            text: 'var(--dark-turquoise, #1F524B)',
            bg: 'var(--dark-turquoise, #1F524B)',
            hoverText: '#ffffff',
        },
        secondary: {
            border: 'var(--gold, #BFA270)',
            text: 'var(--gold, #BFA270)',
            bg: 'var(--gold, #BFA270)',
            hoverText: '#1a1a1a',
        },
        light: {
            border: 'rgba(255, 255, 255, 0.5)',
            text: '#ffffff',
            bg: '#ffffff',
            hoverText: 'var(--dark-turquoise, #1F524B)',
        },
    };

    const colorScheme = colors[variant];

    const buttonContent = (
        <>
            {/* Left arrow - appears on hover */}
            <ArrowRight
                className="absolute w-4 h-4 left-[-25%] z-[9] group-hover:left-4 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ stroke: colorScheme.hoverText }}
            />

            {/* Text */}
            <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-out uppercase tracking-[0.08em] font-semibold text-[0.8125rem]">
                {text}
            </span>

            {/* Circle background - expands on hover */}
            <span
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-[50%] opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{ backgroundColor: colorScheme.bg }}
            />

            {/* Right arrow - exits on hover */}
            <ArrowRight
                className="absolute w-4 h-4 right-4 z-[9] group-hover:right-[-25%] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ stroke: colorScheme.text }}
            />
        </>
    );

    const baseStyles = `
    group relative flex items-center gap-1 overflow-hidden rounded-[100px] 
    border-[1.5px] bg-transparent px-8 py-3.5 cursor-pointer 
    transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] 
    hover:border-transparent hover:rounded-[12px] active:scale-[0.95]
    ${className}
  `.trim();

    if (href) {
        return (
            <Link
                href={href}
                className={baseStyles}
                style={{
                    borderColor: colorScheme.border,
                    color: colorScheme.text,
                }}
            >
                {buttonContent}
                <style jsx>{`
          a:hover {
            color: ${colorScheme.hoverText};
          }
        `}</style>
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            className={baseStyles}
            style={{
                borderColor: colorScheme.border,
                color: colorScheme.text,
            }}
        >
            {buttonContent}
            <style jsx>{`
        button:hover {
          color: ${colorScheme.hoverText};
        }
      `}</style>
        </button>
    );
}

export default FlowButton;
