import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign Up | 27 Estates',
    robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
