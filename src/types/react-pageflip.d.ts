declare module 'react-pageflip' {
    import React from 'react';

    export interface FlipBookProps {
        width: number;
        height: number;
        size?: 'fixed' | 'stretch';
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        drawShadow?: boolean;
        flippingTime?: number;
        usePortrait?: boolean;
        startZIndex?: number;
        autoSize?: boolean;
        maxShadowOpacity?: number;
        showCover?: boolean;
        mobileScrollSupport?: boolean;
        clickEventForward?: boolean;
        useMouseEvents?: boolean;
        swipeDistance?: number;
        showPageCorners?: boolean;
        disableFlipByClick?: boolean;
        style?: React.CSSProperties;
        startPage?: number;
        className?: string;
        children: React.ReactNode;
        ref?: React.Ref<any>;
    }

    export default class HTMLFlipBook extends React.Component<FlipBookProps> { }
}
