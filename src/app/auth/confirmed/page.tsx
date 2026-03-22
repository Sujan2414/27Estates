'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function EmailConfirmedPage() {
    useEffect(() => {
        (async () => {
            // Force the client-side Supabase to read the session from cookies
            // and write it to localStorage. This triggers a `storage` event that
            // supabase.auth.onAuthStateChange() in the original signup tab picks up,
            // causing that tab to auto-redirect to /properties.
            const supabase = createClient();
            await supabase.auth.getSession();

            // Belt-and-suspenders: also broadcast explicitly for same-browser tabs.
            try {
                const channel = new BroadcastChannel('auth_confirmation');
                channel.postMessage({ type: 'email_confirmed' });
                setTimeout(() => channel.close(), 1000);
            } catch {
                localStorage.setItem('email_confirmed', Date.now().toString());
            }
        })();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900">Email Confirmed!</h1>

                <p className="text-gray-600 text-lg">
                    Your email has been successfully verified.
                </p>

                <p className="text-gray-500 text-sm">
                    You can close this tab and return to the app — you&apos;ll be taken to the dashboard automatically.
                </p>
            </div>
        </div>
    );
}
