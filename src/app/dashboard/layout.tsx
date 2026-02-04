import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="md:ml-64 min-h-screen transition-all duration-300">
                {children}
            </div>
        </div>
    );
}
