import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Bookmarks | 27 Estates',
    robots: { index: false, follow: true },
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
