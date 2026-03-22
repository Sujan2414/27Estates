'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EmailConfirmedPage() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const supabase = createClient();
            // Sync session from cookies → localStorage so the waiting tab picks it up
            await supabase.auth.getSession();

            // Signal the original tab
            try {
                const channel = new BroadcastChannel('auth_confirmation');
                channel.postMessage({ type: 'email_confirmed' });
                setTimeout(() => channel.close(), 1000);
            } catch {
                localStorage.setItem('email_confirmed', Date.now().toString());
            }

            // Redirect this tab to listings after a short moment
            setTimeout(() => router.push('/properties'), 2000);
        })();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900">Email Confirmed!</h1>

                <p className="text-gray-500">
                    Taking you to the listings page…
                </p>
            </div>
        </div>
    );
}
