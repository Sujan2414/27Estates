'use client';

import { PropsWithChildren } from 'react';

// Simple passthrough — no transition effects
export default function PageTransitionLayout({ children }: PropsWithChildren) {
    return <>{children}</>;
}
