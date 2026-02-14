"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
    content,
    contentClassName,
}: {
    content: {
        title: string;
        description: string | React.ReactNode;
        content?: React.ReactNode | any;
    }[];
    contentClassName?: string;
}) => {
    const [activeCard, setActiveCard] = React.useState(0);
    const ref = useRef<any>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });
    const cardLength = content.length;

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const cardsBreakpoints = content.map((_, index) => index / (cardLength - 1));
        const closestBreakpointIndex = cardsBreakpoints.reduce(
            (acc, breakpoint, index) => {
                const distance = Math.abs(latest - breakpoint);
                if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
                    return index;
                }
                return acc;
            },
            0
        );
        setActiveCard(closestBreakpointIndex);
    });

    const backgroundColors = [
        "#f9f6f3",
        "#f9f6f3",
        "#f9f6f3",
    ];

    const linearGradients = [
        "linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
        "linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
        "linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
    ];

    const [backgroundGradient, setBackgroundGradient] = useState(
        linearGradients[0]
    );

    useEffect(() => {
        setBackgroundGradient(linearGradients[activeCard % linearGradients.length]);
    }, [activeCard]);

    return (
        <motion.div
            animate={{
                backgroundColor: backgroundColors[activeCard % backgroundColors.length],
            }}
            className="flex justify-center relative gap-20 rounded-md p-10 w-full"
            ref={ref}
        >
            <div className="div relative flex items-start px-4 w-full md:w-1/2">
                <div className="max-w-2xl">
                    {content.map((item, index) => (
                        <div key={item.title + index} className="my-20 min-h-[70vh] flex flex-col justify-center">
                            <motion.h2
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                }}
                                className="text-4xl font-bold text-slate-800"
                            >
                                {item.title}
                            </motion.h2>
                            <motion.div
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                }}
                                className="text-lg text-slate-600 max-w-md mt-6"
                            >
                                {item.description}
                            </motion.div>
                        </div>
                    ))}
                    <div className="h-40" />
                </div>
            </div>
            <div
                style={{ background: backgroundGradient }}
                className={cn(
                    "hidden lg:block h-[60vh] max-h-[800px] w-1/2 rounded-md sticky top-20 overflow-hidden",
                    contentClassName
                )}
            >
                {content[activeCard].content ?? null}
            </div>
        </motion.div>
    );
};
