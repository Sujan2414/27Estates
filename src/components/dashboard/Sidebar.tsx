'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, Building2, Heart, Users, LogOut, PlusCircle } from 'lucide-react';
import Image from 'next/image';

const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
        { icon: Building2, label: "My Listings", path: "/dashboard/listings" },
        { icon: PlusCircle, label: "Add Listing", path: "/dashboard/add-listing" },
        { icon: Heart, label: "Saved", path: "/dashboard/saved" },
        { icon: Users, label: "Profile", path: "/dashboard/profile" },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100 flex justify-center">
                <Link href="/">
                    <Image
                        src="/Nav_Logo_HD_v3.png"
                        alt="27 Estates"
                        width={180}
                        height={60}
                        className="object-contain"
                        priority
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-[var(--dark-turquoise)] text-white shadow-md shadow-[var(--dark-turquoise)]/20"
                                    : "text-gray-500 hover:text-[var(--dark-turquoise)] hover:bg-[var(--dark-turquoise)]/5"
                                }`}
                        >
                            <item.icon size={20} strokeWidth={1.5} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut size={20} strokeWidth={1.5} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
