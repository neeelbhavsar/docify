'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/services/projectService';
import { ActivityLog } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

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

export default function ActivityPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        projectService.getActivity(projectId).then((res) => {
            setLogs((res.data.data as ActivityLog[]) || []);
        }).finally(() => setLoading(false));
    }, [projectId]);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Link href={`/projects/${projectId}`}>
                    <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
                    <p className="text-sm text-muted-foreground">Recent actions in this project</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20">
                    <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log, i) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
                        >
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 mt-0.5 ${ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-400'}`}>
                                {log.action.replace(/_/g, ' ')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground font-medium">{log.user?.name}</p>
                                <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeTime(log.createdAt)}</span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
