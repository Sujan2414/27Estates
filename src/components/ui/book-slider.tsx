'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BookSliderProps {
    pdfUrl: string;
}

export default function BookSlider({ pdfUrl }: BookSliderProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const flipBookRef = useRef<any>(null);
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    const onPageLoadSuccess = useCallback((page: any) => {
        if (!pdfDimensions) {
            setPdfDimensions({
                width: page.originalWidth,
                height: page.originalHeight
            });
        }
    }, [pdfDimensions]);

    const onFlip = useCallback((e: any) => {
        setCurrentPage(e.data);
    }, []);

    const goToPage = (pageIndex: number) => {
        if (flipBookRef.current) {
            flipBookRef.current.pageFlip().turnToPage(pageIndex);
        }
    };

    // Auto-scroll thumbnail into view
    useEffect(() => {
        if (numPages > 0) {
            const thumbnailId = `thumb-${currentPage + 1}`;
            const element = document.getElementById(thumbnailId);
            if (element && thumbnailContainerRef.current) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [currentPage, numPages]);


    // Calculate dimensions based on container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setContainerSize({ width, height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Calculate optimal page dimensions
    const getPageDimensions = () => {
        if (!containerSize.width || !pdfDimensions) return { width: 400, height: 600 };

        const availableWidth = containerSize.width;
        const availableHeight = containerSize.height - 120; // Subtract space for carousel

        const ratio = pdfDimensions.height / pdfDimensions.width;

        let pageWidth: number;
        let pageHeight: number;

        if (isMobile) {
            // Single page on mobile — fill width with padding
            pageWidth = availableWidth - 32;
            pageHeight = pageWidth * ratio;
            // Cap height if it exceeds available
            if (pageHeight > availableHeight) {
                pageHeight = availableHeight;
                pageWidth = pageHeight / ratio;
            }
        } else {
            // Double page spread on desktop
            pageHeight = availableHeight;
            pageWidth = pageHeight / ratio;
            if (pageWidth * 2 > availableWidth) {
                pageWidth = availableWidth / 2;
                pageHeight = pageWidth * ratio;
            }
        }

        return {
            width: Math.floor(pageWidth * 0.95),
            height: Math.floor(pageHeight * 0.95)
        };
    };

    const { width: pageWidth, height: pageHeight } = getPageDimensions();

    return (
        <div className="flex flex-col h-full w-full bg-gray-100">
            {/* Main Flipbook Area */}
            <div
                ref={containerRef}
                className="flex-grow relative flex justify-center items-center overflow-hidden"
                style={{ minHeight: isMobile ? '300px' : '500px' }}
            >
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-center p-4">Loading PDF...</div>}
                    className="flex justify-center items-center"
                >
                    {!pdfDimensions && numPages > 0 && (
                        <div style={{ display: 'none' }}>
                            <Page pageNumber={1} onLoadSuccess={onPageLoadSuccess} />
                        </div>
                    )}

                    {numPages > 0 && containerSize.width > 0 && pdfDimensions && (
                        <HTMLFlipBook
                            width={pageWidth}
                            height={pageHeight}
                            size="fixed"
                            minWidth={200}
                            maxWidth={2000}
                            minHeight={300}
                            maxHeight={2000}
                            maxShadowOpacity={0.5}
                            showCover={true}
                            mobileScrollSupport={true}
                            drawShadow={true}
                            flippingTime={1000}
                            usePortrait={isMobile}
                            startZIndex={0}
                            autoSize={true}
                            clickEventForward={true}
                            useMouseEvents={true}
                            swipeDistance={30}
                            showPageCorners={true}
                            disableFlipByClick={false}
                            style={{ margin: '0 auto' }}
                            startPage={0}
                            className="flip-book shadow-2xl"
                            ref={flipBookRef}
                            onFlip={onFlip}
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <div key={index + 1} className="page bg-white flex justify-center items-center overflow-hidden">
                                    <Page
                                        pageNumber={index + 1}
                                        width={pageWidth}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        loading={<div className="flex items-center justify-center h-full w-full text-gray-400">Loading...</div>}
                                    />
                                </div>
                            ))}
                        </HTMLFlipBook>
                    )}
                </Document>

                {/* Navigation Arrows */}
                <button
                    onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-all z-10"
                    disabled={currentPage === 0}
                >
                    <ChevronLeft className={currentPage === 0 ? "text-gray-300" : "text-gray-800"} size={24} />
                </button>
                <button
                    onClick={() => flipBookRef.current?.pageFlip().flipNext()}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-all z-10"
                    disabled={currentPage === numPages - 1}
                >
                    <ChevronRight className={currentPage === numPages - 1 ? "text-gray-300" : "text-gray-800"} size={24} />
                </button>
            </div>

            {/* Thumbnail Carousel */}
            {numPages > 0 && (
                <div
                    ref={thumbnailContainerRef}
                    className="h-[120px] bg-gray-900/90 w-full overflow-x-auto whitespace-nowrap p-4 flex items-center space-x-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                >
                    <Document file={pdfUrl}>
                        {Array.from(new Array(numPages), (_, index) => (
                            <div
                                key={`thumb-${index + 1}`}
                                id={`thumb-${index + 1}`}
                                onClick={() => goToPage(index)}
                                className={`inline-block cursor-pointer transition-all duration-200 rounded-md overflow-hidden border-2 ${currentPage === index || (currentPage === index + 1 && index !== 0) // rough spread matching 
                                    ? 'border-yellow-500 scale-105 opacity-100'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                style={{ minWidth: '60px' }}
                            >
                                <Page
                                    pageNumber={index + 1}
                                    width={80}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                                <div className="text-center text-[10px] text-white bg-black/50 py-1">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </Document>
                </div>
            )}
        </div>
    );
}
