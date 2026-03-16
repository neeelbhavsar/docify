'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKey, Users, Loader2, Trash2, ExternalLink, X, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const createSchema = z.object({
    name: z.string().min(2, 'At least 2 characters'),
    description: z.string().max(500).optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const PROJECT_GRADIENTS = [
    'from-indigo-500/20 via-violet-500/10 to-purple-500/10 border-indigo-500/25',
    'from-cyan-500/20 via-blue-500/10 to-indigo-500/10 border-cyan-500/25',
    'from-emerald-500/20 via-teal-500/10 to-cyan-500/10 border-emerald-500/25',
    'from-orange-500/20 via-amber-500/10 to-yellow-500/10 border-orange-500/25',
    'from-pink-500/20 via-rose-500/10 to-red-500/10 border-pink-500/25',
    'from-violet-500/20 via-purple-500/10 to-pink-500/10 border-violet-500/25',
];

const PROJECT_ICON_COLORS = [
    'from-indigo-500 to-violet-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-purple-600',
];

function getProjectStyle(id: string) {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
        gradient: PROJECT_GRADIENTS[hash % PROJECT_GRADIENTS.length],
        iconColor: PROJECT_ICON_COLORS[hash % PROJECT_ICON_COLORS.length],
    };
}

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
            <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                </div>
            </div>
            <div className="flex gap-3">
                <div className="h-6 bg-muted rounded-full w-20" />
                <div className="h-6 bg-muted rounded-full w-24" />
            </div>
        </div>
    );
}

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.07 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const form = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

    const loadProjects = async () => {
        try {
            const res = await projectService.getAll();
            setProjects(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProjects(); }, []);

    const handleCreate = async (data: CreateForm) => {
        setCreating(true);
        try {
            const res = await projectService.create(data);
            setProjects((p) => [res.data.data!, ...p]);
            setShowModal(false);
            form.reset();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this project? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await projectService.delete(id);
            setProjects((p) => p.filter((pr) => pr._id !== id));
        } catch (e) { console.error(e); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 sm:mb-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: [0, 15, -10, 0] }}
                            transition={{ duration: 1.5, delay: 0.3 }}
                        >
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </motion.div>
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Your Workspace</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
                    <p className="text-muted-foreground text-sm mt-1.5">
                        {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} · Securely manage all environments`}
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
                >
                    <Plus className="w-4 h-4" />
                    New Project
                </motion.button>
            </div>

            {/* Project grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : projects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-28"
                >
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 blur-xl" />
                        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/10 border border-indigo-500/25 flex items-center justify-center">
                            <FolderKey className="w-9 h-9 text-indigo-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No projects yet</h3>
                    <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                        Create your first project to start managing credentials securely across your team.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25"
                    >
                        Create your first project
                    </motion.button>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <AnimatePresence mode="popLayout">
                        {projects.map((project) => {
                            const { gradient, iconColor } = getProjectStyle(project._id);
                            return (
                                <motion.div key={project._id} variants={cardVariants} exit="exit" layout>
                                    <Link href={`/projects/${project._id}`}>
                                        <div className={`group relative rounded-2xl border bg-gradient-to-br ${gradient} p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10`}>
                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => handleDelete(project._id, e)}
                                                disabled={deletingId === project._id}
                                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/15 transition-all z-10"
                                            >
                                                {deletingId === project._id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>

                                            {/* Icon + Name */}
                                            <div className="flex items-start gap-3.5 mb-5">
                                                <div className={`relative flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg`}>
                                                    <FolderKey className="w-5.5 h-5.5 text-white" />
                                                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${iconColor} opacity-40 blur-md -z-10 scale-110`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-foreground truncate pr-8 text-[15px]">{project.name}</h3>
                                                    {project.description ? (
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{project.description}</p>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground/50 mt-0.5 italic">No description</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/40 text-[11px] font-medium text-muted-foreground">
                                                    <Users className="w-3 h-3" />
                                                    {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                                                </span>
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/40 text-[11px] font-medium text-muted-foreground">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {formatRelativeTime(project.createdAt)}
                                                </span>
                                            </div>

                                            {/* Hover arrow */}
                                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-1">
                                                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Create Project Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="relative bg-card border border-border/60 rounded-2xl p-7 w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            {/* Decorative gradient top */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
                            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl" />

                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/25 flex items-center justify-center mb-3">
                                    <FolderKey className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-lg font-bold text-foreground">Create New Project</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Organize your credentials in one secure place</p>
                            </div>

                            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Name</label>
                                    <input
                                        {...form.register('name')}
                                        placeholder="e.g. Production Backend"
                                        className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-red-400 text-xs mt-1">{form.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Description <span className="text-muted-foreground font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        {...form.register('description')}
                                        placeholder="Brief description of this project..."
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={creating}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
                                    >
                                        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Create Project
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
