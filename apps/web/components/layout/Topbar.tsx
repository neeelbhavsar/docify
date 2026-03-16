'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Sun, Moon, LogOut, Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { theme, setTheme } = useTheme();
    const { user, clearAuth } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        clearAuth();
        router.replace('/auth');
    };

    return (
        <header className="h-14 flex items-center gap-4 px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm">
            {/* Mobile Menu Button */}
            <button 
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Search placeholder */}
            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
                {/* Notifications badge */}
                <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Bell className="w-4 h-4" />
                </button>

                {/* Theme toggle */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>

                {/* User info + logout */}
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
