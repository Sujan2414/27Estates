'use client';

import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
    return (
        <div style={{ marginBottom: '40px' }}>
            {/* Mobile: sidebar icon logo, centered */}
            <div className="block lg:hidden" style={{ textAlign: 'center' }}>
                <Link href="/" style={{ display: 'inline-block', position: 'relative', width: '120px', height: '120px' }}>
                    <Image
                        src="/logo without bg (1).png"
                        alt="27 Estates"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </Link>
            </div>
            {/* Desktop: full logo with primary color rectangle bg */}
            <div className="hidden lg:block">
                <Link href="/" style={{
                    display: 'block',
                    position: 'relative',
                    width: '320px',
                    height: '160px',
                }}>
                    <Image
                        src="/logo without bg (1).png"
                        alt="27 Estates"
                        fill
                        style={{ objectFit: 'contain', objectPosition: 'left' }}
                        priority
                    />
                </Link>
            </div>
        </div>
    );
};

export default Logo;


