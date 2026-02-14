'use client';

import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
    return (
        <div style={{ marginBottom: '64px', marginTop: '-32px' }}>
            <Link href="/">
                <Image
                    src="/Nav_Logo_HD_v3.png"
                    alt="27 Estates"
                    width={140}
                    height={42}
                    className="h-auto object-contain cursor-pointer"
                    priority
                />
            </Link>
        </div>
    );
};

export default Logo;
