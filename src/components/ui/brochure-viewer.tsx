'use client';

import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, Lock, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './brochure-viewer.module.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker
// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import BookSlider from './book-slider';

interface BrochureViewerProps {
    brochureUrl: string;
    projectName: string;
}

function BrochureViewerInner({ brochureUrl, projectName }: BrochureViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = brochureUrl;
        link.download = `${projectName}-brochure.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`${styles.viewerContainer} ${isFullscreen ? styles.fullscreen : ''}`} style={{ height: '700px' }}>
            <div className={styles.viewerHeader}>
                <span className={styles.pageInfo}>
                    Interactive Brochure
                </span>
                <div className={styles.viewerControls}>
                    <button
                        className={styles.controlBtn}
                        onClick={handleDownload}
                        title="Download PDF"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        className={styles.controlBtn}
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    {isFullscreen && (
                        <button
                            className={styles.controlBtn}
                            onClick={() => setIsFullscreen(false)}
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.bookContainer} style={{ height: 'calc(100% - 40px)', width: '100%', overflow: 'hidden' }}>
                <BookSlider pdfUrl={brochureUrl} />
            </div>
        </div>
    );
}

interface BrochureSectionProps {
    brochureUrl: string | null;
    projectName: string;
}

export function BrochureSection({ brochureUrl, projectName }: BrochureSectionProps) {
    const { isLoggedIn, showAuthModal } = useAuth();
    // Default to open for standard view
    const [viewerOpen, setViewerOpen] = useState(true);

    if (!brochureUrl) return null;

    if (!isLoggedIn) {
        return (
            <div className={styles.blurredOverlay}>
                <div className={styles.lockContent}>
                    <Lock className={styles.lockIcon} />
                    <h3 className={styles.lockTitle}>Brochure Available</h3>
                    <p className={styles.lockText}>
                        Please log in to view or download the brochure
                    </p>
                    <button
                        className={styles.signInBtn}
                        onClick={() => showAuthModal(window.location.pathname)}
                    >
                        <Lock size={14} />
                        Sign In to Access
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-end mb-4">
                <button
                    className={`${styles.brochureBtn} ${styles.brochureBtnSecondary}`}
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = brochureUrl;
                        link.download = `${projectName}-brochure.pdf`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                >
                    <Download size={16} />
                    Download PDF
                </button>
            </div>

            <BrochureViewerInner
                brochureUrl={brochureUrl}
                projectName={projectName}
            />
        </div>
    );
}

export default BrochureSection;
