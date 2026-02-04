'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './Preloader.module.css';

interface PreloaderProps {
    onComplete?: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Sequence: 
        // 0.0s: Open (Up/Down)
        // 1.5s: Close (Down/Up)
        // 2.1s: Finish
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) {
                setTimeout(onComplete, 600);
            }
        }, 2100);

        return () => clearTimeout(timer);
    }, [onComplete]);

    const transitionProps = {
        duration: 0.5,
        ease: "easeInOut"
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.preloader}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.5, ease: "easeInOut" }
                    }}
                >
                    <div className={styles.container}>
                        {/* TOP: Up.png */}
                        <div className={styles.splitTop}>
                            <motion.div
                                className={styles.imageWrapper}
                                initial={{ y: "100%" }}
                                animate={{ y: "0%" }}
                                exit={{
                                    y: "100%",
                                    transition: { duration: 0.5, ease: "easeInOut", delay: 0 }
                                }}
                                transition={{ duration: 0.5, ease: "easeInOut", delay: 0 }}
                            >
                                <Image
                                    src="/Up.png"
                                    alt="27 Estates Mark"
                                    width={200}
                                    height={200}
                                    className={styles.imageUp}
                                    priority
                                />
                            </motion.div>
                        </div>

                        {/* NO CENTRAL LINE */}

                        {/* BOTTOM: Down.png */}
                        <div className={styles.splitBottom}>
                            <motion.div
                                className={styles.imageWrapper}
                                initial={{ y: "-100%" }}
                                animate={{ y: "0%" }}
                                exit={{
                                    y: "-100%",
                                    transition: { duration: 0.5, ease: "easeInOut", delay: 0 }
                                }}
                                transition={{ duration: 0.5, ease: "easeInOut", delay: 0 }}
                            >
                                <Image
                                    src="/Down.png"
                                    alt="27 Estates Text"
                                    width={180}
                                    height={50}
                                    className={styles.imageDown}
                                    priority
                                />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
