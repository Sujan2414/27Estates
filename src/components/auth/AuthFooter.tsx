'use client';

const AuthFooter = () => {
    return (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" style={{ marginTop: '32px' }}>
            <div className="w-6 h-6 rounded-full bg-[#3ECF8E] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white">
                    <path
                        d="M17.8 7.3h-7.6L12 1h-1.5L4.2 13.5h7.6L10.2 23h1.5l6.1-15.7z"
                        fill="currentColor"
                    />
                </svg>
            </div>
            <span>Auth by Supabase</span>
        </div>
    );
};

export default AuthFooter;
