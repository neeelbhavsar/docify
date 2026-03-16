'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    FolderKey,
    Activity,
    Settings,
    ShieldCheck,
    ChevronRight,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKey },
    { href: '/activity', label: 'Activity', icon: Activity },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();

    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-64 h-full flex flex-col bg-card border-r border-border"
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground text-sm">DevVault</p>
                        <p className="text-[10px] text-muted-foreground">Credential Manager</p>
                    </div>
                </div>
                {/* Mobile close button */}
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="lg:hidden p-1.5 -mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} onClick={onClose}>
                            <motion.div
                                whileHover={{ x: 2 }}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer',
                                    isActive
                                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-400' : '')} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight className="w-3 h-3 text-indigo-400" />}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">AES-256 Encrypted</span>
                </div>
            </div>
        </motion.aside>
    );
}
