'use client';

import { LuminaInteractiveList } from "@/components/ui/lumina-interactive-list";
import Navigation from "@/components/Navigation";

export default function LuminaDemoPage() {
    return (
        <>
            <Navigation alwaysScrolled={false} />
            <LuminaInteractiveList />
        </>
    );
}
