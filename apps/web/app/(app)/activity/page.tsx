'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity as ActivityIcon } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { ActivityLog, Project } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

const ACTION_COLORS: Record<string, string> = {
    PROJECT_CREATED: 'bg-green-500/20 text-green-400',
    PROJECT_UPDATED: 'bg-blue-500/20 text-blue-400',
    MEMBER_ADDED: 'bg-indigo-500/20 text-indigo-400',
    MEMBER_REMOVED: 'bg-orange-500/20 text-orange-400',
    CREDENTIAL_CREATED: 'bg-violet-500/20 text-violet-400',
    CREDENTIAL_UPDATED: 'bg-yellow-500/20 text-yellow-400',
    CREDENTIAL_DELETED: 'bg-red-500/20 text-red-400',
    CREDENTIAL_REVEALED: 'bg-cyan-500/20 text-cyan-400',
};

interface DetailedActivityLog extends ActivityLog {
    project: {
        _id: string;
        name: string;
    };
}

export default function ActivityListPage() {
    const [logs, setLogs] = useState<DetailedActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        projectService.getGlobalActivityLog()
            .then(res => setLogs((res.data.data as any) || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 p-6 bg-card" 
                 style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))' }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                        <ActivityIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold gradient-text">Global Activity</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Audit logs across all your projects</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-32 bg-card border border-dashed border-border rounded-3xl">
                    <ActivityIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm font-medium">No activity recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log, i) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all"
                        >
                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-400'}`}>
                                {log.action.replace(/_/g, ' ')}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <p className="text-sm font-semibold text-foreground">{log.user?.name}</p>
                                    <span className="text-[10px] text-muted-foreground">in</span>
                                    <Link href={`/projects/${log.project?._id}`} className="text-xs font-bold text-indigo-400 hover:underline underline-offset-4">
                                        {log.project?.name}
                                    </Link>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate opacity-60 mt-0.5">{log.user?.email}</p>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeTime(log.createdAt)}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
