'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isAuthenticated) {
            router.replace('/auth');
        }
    }, [isAuthenticated, router, isMounted]);

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)} 
                />
            )}
            
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden w-full relative">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">{children}</main>
            </div>
        </div>
    );
}
