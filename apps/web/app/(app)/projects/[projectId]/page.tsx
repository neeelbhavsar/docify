'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Key, Eye, EyeOff, Copy, Check, Trash2, Users,
    Loader2, Shield, X, UserPlus, ChevronDown, ChevronUp, Pencil,
    Download, FileText, Sparkles, Lock, Crown, Star, Globe, Server,
    StickyNote, Layers, Bold, Italic, Underline, Strikethrough, Code,
    List, ListOrdered, Heading1, Heading2, Heading3, Type, Save,
    ClipboardCopy, BookOpen, Edit3, Search, Terminal, Highlighter,
    AlignLeft, Clock
} from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/services/projectService';
import { credentialService } from '@/services/credentialService';
import { Project, Credential, CredentialType, CredentialEnvironment, CredentialWithData } from '@/types';
import { CREDENTIAL_ICONS, CREDENTIAL_COLORS, formatRelativeTime, maskValue } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const CREDENTIAL_TYPES: CredentialType[] = [
    'AWS', 'REDIS', 'SES', 'SENDGRID', 'STRIPE', 'PAYPAL',
    'MONGODB', 'POSTGRESQL', 'MYSQL', 'API_KEY', 'DEVOPS',
    'ENV_FRONTEND', 'ENV_BACKEND', 'OTHER',
];

const ENVIRONMENTS: { label: string; value: CredentialEnvironment; color: string; bg: string }[] = [
    { label: 'Local', value: 'LOCAL', color: 'rgb(148,163,184)', bg: 'rgba(148,163,184,0.15)' },
    { label: 'Development', value: 'DEVELOPMENT', color: 'rgb(59,130,246)', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Stage', value: 'STAGE', color: 'rgb(245,158,11)', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Production', value: 'PRODUCTION', color: 'rgb(239,68,68)', bg: 'rgba(239,68,68,0.15)' },
];

const TYPE_DEFAULTS: Record<string, string[]> = {
    AWS: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    REDIS: ['REDIS_URL', 'REDIS_PASSWORD'],
    STRIPE: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    MONGODB: ['MONGODB_URI', 'MONGODB_DB'],
    POSTGRESQL: ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
    SENDGRID: ['SENDGRID_API_KEY', 'FROM_EMAIL'],
    PAYPAL: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
    API_KEY: ['API_KEY', 'API_SECRET'],
    default: ['KEY_1', 'KEY_2'],
};

function getDefaultKeys(type: CredentialType): string[] {
    return TYPE_DEFAULTS[type] || TYPE_DEFAULTS.default;
}

// ─── Shared Modal Shell ──────────────────────────────────────────────────────
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
                {children}
            </motion.div>
        </div>
    );
}

// ─── Shared Key-Value Editor ─────────────────────────────────────────────────
function KeyValueEditor({
    fields,
    onAdd,
    onRemove,
    onUpdate,
    showValues = false,
}: {
    fields: { key: string; value: string }[];
    onAdd: () => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, field: 'key' | 'value', val: string) => void;
    showValues?: boolean;
}) {
    const [visibleIdx, setVisibleIdx] = useState<Set<number>>(new Set());
    const toggleVisible = (i: number) => setVisibleIdx(prev => {
        const next = new Set(prev);
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Key-Value Pairs</label>
                <button type="button" onClick={onAdd} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Field
                </button>
            </div>
            <div className="space-y-2">
                {fields.map((f, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={f.key}
                            onChange={(e) => onUpdate(i, 'key', e.target.value)}
                            placeholder="KEY_NAME"
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 uppercase"
                        />
                        <div className="flex-1 flex gap-1">
                            <input
                                value={f.value}
                                onChange={(e) => onUpdate(i, 'value', e.target.value)}
                                placeholder="value"
                                type={showValues && visibleIdx.has(i) ? 'text' : 'password'}
                                className="flex-1 w-0 px-3 py-2 bg-background border border-input rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                            {showValues && (
                                <button
                                    type="button"
                                    onClick={() => toggleVisible(i)}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {visibleIdx.has(i) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            )}
                        </div>
                        <button type="button" onClick={() => onRemove(i)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Edit Credential Modal ───────────────────────────────────────────────────
function EditCredentialModal({
    projectId,
    credential,
    onClose,
    onUpdated,
}: {
    projectId: string;
    credential: Credential;
    onClose: () => void;
    onUpdated: (updated: Credential) => void;
}) {
    const [title, setTitle] = useState(credential.title);
    const [fields, setFields] = useState<{ key: string; value: string }[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [revealedOnce, setRevealedOnce] = useState(false);

    const handleRevealInModal = async () => {
        setLoadingData(true);
        try {
            const res = await credentialService.reveal(projectId, credential._id);
            const data = res.data.data?.data || {};
            setFields(Object.entries(data).map(([key, value]) => ({ key, value })));
            setRevealedOnce(true);
        } catch (e: any) {
            setError('Failed to reveal secret values.');
        } finally {
            setLoadingData(false);
        }
    };

    // Pre-load blank fields initially
    useEffect(() => {
        setFields(
            Array.from({ length: credential.keyCount || 1 }).map(() => ({ key: '', value: '' }))
        );
        setLoadingData(false);
    }, []);

    const addField = () => setFields(f => [...f, { key: '', value: '' }]);
    const removeField = (i: number) => setFields(f => f.filter((_, idx) => idx !== i));
    const updateField = (i: number, field: 'key' | 'value', val: string) =>
        setFields(f => f.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required'); return; }
        if (fields.some(f => !f.key.trim())) { setError('All keys must have a name'); return; }

        const data: Record<string, string> = {};
        fields.forEach(f => { if (f.key.trim()) data[f.key.trim()] = f.value; });

        setSaving(true);
        setError('');
        try {
            await credentialService.update(projectId, credential._id, { title, data });
            onUpdated({ ...credential, title, keyCount: Object.keys(data).length });
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to update. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell onClose={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{CREDENTIAL_ICONS[credential.type]}</span>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Edit Credential</h2>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {credential.type}
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Credential title"
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>

                {loadingData ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
                    </div>
                ) : !revealedOnce ? (
                    <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground mb-4">Values are currently encrypted.</p>
                        <button
                            type="button"
                            onClick={handleRevealInModal}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all"
                        >
                            <Eye className="w-3.5 h-3.5" /> Reveal to Edit
                        </button>
                    </div>
                ) : (
                    <KeyValueEditor
                        fields={fields}
                        onAdd={addField}
                        onRemove={removeField}
                        onUpdate={updateField}
                        showValues={true}
                    />
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loadingData || !title.trim()}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// ─── Credential Card (Premium) ───────────────────────────────────────────────
const GLOW_COLORS: Record<string, string> = {
    AWS: '255,165,0', REDIS: '239,68,68', SES: '234,179,8', SENDGRID: '59,130,246',
    STRIPE: '139,92,246', PAYPAL: '37,99,235', MONGODB: '34,197,94', POSTGRESQL: '14,165,233',
    MYSQL: '20,184,166', API_KEY: '245,158,11', DEVOPS: '148,163,184',
    ENV_FRONTEND: '236,72,153', ENV_BACKEND: '99,102,241', OTHER: '107,114,128',
};

function CredentialCard({
    credential: initialCredential, projectId, userRole, onDelete,
}: { credential: Credential; projectId: string; userRole: string; onDelete: (id: string) => void; }) {
    const [credential, setCredential] = useState(initialCredential);
    const [revealed, setRevealed] = useState<CredentialWithData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const canEdit = userRole === 'OWNER' || userRole === 'ADMIN';
    const glow = GLOW_COLORS[credential.type] || '107,114,128';
    const colorClass = CREDENTIAL_COLORS[credential.type] || CREDENTIAL_COLORS.OTHER;
    const env = ENVIRONMENTS.find(e => e.value === credential.environment) || ENVIRONMENTS[3];

    const handleReveal = async () => {
        if (revealed) { setRevealed(null); return; }
        setLoading(true);
        try {
            const res = await credentialService.reveal(projectId, credential._id);
            setRevealed(res.data.data!);
            setExpanded(true);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCopy = async (key: string, value: string) => {
        await navigator.clipboard.writeText(value);
        setCopying(key);
        setTimeout(() => setCopying(null), 2000);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={`group relative rounded-2xl border bg-gradient-to-br ${colorClass} overflow-hidden transition-all duration-300 hover:-translate-y-0.5`}
                style={{ boxShadow: `0 0 0 1px rgba(${glow},0.2), 0 4px 24px rgba(${glow},0.08)` }}
                whileHover={{ boxShadow: `0 0 0 1px rgba(${glow},0.4), 0 8px 32px rgba(${glow},0.18)` }}
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, rgba(${glow},0.8), transparent)` }} />

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Icon with glow */}
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-background/30 flex items-center justify-center text-xl border border-white/10">
                                {CREDENTIAL_ICONS[credential.type]}
                            </div>
                            <div className="absolute inset-0 rounded-xl blur-md opacity-60" style={{ background: `rgba(${glow},0.3)`, zIndex: -1 }} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-bold text-foreground truncate text-sm">{credential.title}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: `rgba(${glow},0.15)`, color: `rgb(${glow})`, border: `1px solid rgba(${glow},0.3)` }}>
                                            {credential.type.replace('_', ' ')}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: env.bg, color: env.color, border: `1px solid ${env.color}40` }}>
                                            {env.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={handleReveal} disabled={loading}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/40 hover:bg-background/60 text-xs font-semibold text-foreground transition-all border border-white/10"
                                    >
                                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {revealed ? 'Hide' : 'Reveal'}
                                    </motion.button>
                                    {canEdit && (
                                        <button onClick={() => setShowEdit(true)}
                                            className="p-1.5 rounded-lg bg-background/30 hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400 transition-all border border-white/5"
                                        ><Pencil className="w-3.5 h-3.5" /></button>
                                    )}
                                    <button onClick={() => setExpanded(e => !e)}
                                        className="p-1.5 rounded-lg bg-background/30 hover:bg-background/50 text-foreground transition-all border border-white/5"
                                    >{expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
                                    {canEdit && (
                                        <button onClick={() => onDelete(credential._id)}
                                            className="p-1.5 rounded-lg bg-background/30 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all border border-white/5"
                                        ><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                </div>
                            </div>
                            {!expanded && (
                                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    {credential.keyCount} key{credential.keyCount !== 1 ? 's' : ''} · {credential.createdBy?.name} · {formatRelativeTime(credential.createdAt)}
                                </p>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2 overflow-hidden">
                                {revealed ? (
                                    Object.entries(revealed.data).map(([key, value]) => (
                                        <motion.div key={key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 p-3 rounded-xl bg-background/40 border border-white/5 group/row"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: `rgb(${glow})` }}>{key}</p>
                                                <p className="text-xs font-mono text-foreground truncate mt-0.5 animate-value-reveal">{value}</p>
                                            </div>
                                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                onClick={() => handleCopy(key, value)}
                                                className="p-1.5 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                                            >{copying === key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}</motion.button>
                                        </motion.div>
                                    ))
                                ) : (
                                    Array.from({ length: credential.keyCount || 2 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-background/30 border border-white/5">
                                            <div className="flex-1">
                                                <div className="h-1.5 rounded-full w-20 mb-2" style={{ background: `rgba(${glow},0.3)` }} />
                                                <p className="text-xs font-mono text-muted-foreground tracking-[0.3em]">••••••••••••</p>
                                            </div>
                                            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    ))
                                )}
                                <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5" /> Added by {credential.createdBy?.name} · {formatRelativeTime(credential.createdAt)}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
            <AnimatePresence>
                {showEdit && (
                    <EditCredentialModal projectId={projectId} credential={credential}
                        onClose={() => setShowEdit(false)}
                        onUpdated={(u) => { setCredential(u); setRevealed(null); }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Add Credential Modal ────────────────────────────────────────────────────
function AddCredentialModal({
    projectId,
    onClose,
    onAdd,
}: {
    projectId: string;
    onClose: () => void;
    onAdd: (c: Credential) => void;
}) {
    const [selectedType, setSelectedType] = useState<CredentialType>('AWS');
    const [selectedEnv, setSelectedEnv] = useState<CredentialEnvironment>('PRODUCTION');
    const [fields, setFields] = useState<{ key: string; value: string }[]>([]);
    const [title, setTitle] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        setFields(getDefaultKeys(selectedType).map((k) => ({ key: k, value: '' })));
    }, [selectedType]);

    const addField = () => setFields(f => [...f, { key: '', value: '' }]);
    const removeField = (i: number) => setFields(f => f.filter((_, idx) => idx !== i));
    const updateField = (i: number, field: 'key' | 'value', val: string) =>
        setFields(f => f.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const handleSubmit = async () => {
        if (!title.trim() || fields.some(f => !f.key.trim())) return;
        const data: Record<string, string> = {};
        fields.forEach(f => { if (f.key.trim()) data[f.key.trim()] = f.value; });
        setAdding(true);
        try {
            const res = await credentialService.create(projectId, { type: selectedType, title, environment: selectedEnv, data });
            onAdd(res.data.data!);
            onClose();
        } catch (e) { console.error(e); }
        finally { setAdding(false); }
    };

    return (
        <ModalShell onClose={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-foreground mb-5">Add Credential</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Credential Type</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {CREDENTIAL_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`p-2 rounded-lg border text-center transition-all ${selectedType === type ? 'border-indigo-500 bg-indigo-500/10' : 'border-border hover:border-indigo-500/50'}`}
                            >
                                <div className="text-lg">{CREDENTIAL_ICONS[type]}</div>
                                <p className="text-[9px] font-medium text-muted-foreground mt-0.5 truncate">{type}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Environment</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ENVIRONMENTS.map((env) => (
                            <button key={env.value} onClick={() => setSelectedEnv(env.value)}
                                className="px-2 py-2 rounded-lg border text-center transition-all text-xs font-semibold"
                                style={selectedEnv === env.value
                                    ? { background: env.bg, color: env.color, borderColor: env.color + '60' }
                                    : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                                }
                            >{env.label}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`e.g. ${selectedEnv.charAt(0) + selectedEnv.slice(1).toLowerCase()} ${selectedType}`}
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>

                <KeyValueEditor
                    fields={fields}
                    onAdd={addField}
                    onRemove={removeField}
                    onUpdate={updateField}
                />

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={adding || !title.trim()}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Encrypted
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// ─── Notes Tab ───────────────────────────────────────────────────────────────
function htmlToMarkdown(html: string): string {
    return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
        .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
        .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre[^>]*><code[^>]*>([\/\S\s]*?)<\/code><\/pre>/gi, '```\n$1\n```\n')
        .replace(/<pre[^>]*>([\/\S\s]*?)<\/pre>/gi, '```\n$1\n```\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function countWords(html: string): { words: number; chars: number } {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.replace(/\s/g, '').length;
    return { words, chars };
}

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', bg: 'rgba(250,204,21,0.35)', border: 'rgba(250,204,21,0.6)', text: '#a16207' },
    { name: 'Green', bg: 'rgba(34,197,94,0.25)', border: 'rgba(34,197,94,0.5)', text: '#15803d' },
    { name: 'Red', bg: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.5)', text: '#b91c1c' },
    { name: 'Blue', bg: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.5)', text: '#1d4ed8' },
    { name: 'Purple', bg: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.5)', text: '#7c3aed' },
];

function NotesTab({
    project,
    projectId,
    canEdit,
    onSaved,
}: {
    project: import('@/types').Project;
    projectId: string;
    canEdit: boolean;
    onSaved: (notes: string) => void;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastHtmlRef = useRef<string>(project.notes || '');

    // Initialise editor content
    useEffect(() => {
        if (editorRef.current && isEditMode) {
            editorRef.current.innerHTML = project.notes || '<p>Start writing your project notes here…</p>';
            lastHtmlRef.current = editorRef.current.innerHTML;
        }
    }, [isEditMode]);

    const scheduleAutoSave = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaveStatus('saving');
        saveTimerRef.current = setTimeout(async () => {
            const html = editorRef.current?.innerHTML || '';
            if (html === lastHtmlRef.current) { setSaveStatus('idle'); return; }
            try {
                await projectService.updateNotes(projectId, html);
                lastHtmlRef.current = html;
                onSaved(html);
                setSaveStatus('saved');
                setLastSaved(new Date());
                setTimeout(() => setSaveStatus('idle'), 3000);
            } catch {
                setSaveStatus('idle');
            }
        }, 1500);
    }, [projectId, onSaved]);

    const exec = (cmd: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, value);
        scheduleAutoSave();
    };

    const insertHTML = (html: string) => {
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, html);
        scheduleAutoSave();
    };

    const applyHighlight = (color: typeof HIGHLIGHT_COLORS[0]) => {
        setShowHighlightPicker(false);
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        document.execCommand(
            'insertHTML', false,
            `<mark style="background:${color.bg};color:${color.text};border-radius:3px;padding:0 2px;border-bottom:1.5px solid ${color.border}">${sel.toString()}</mark>`
        );
        scheduleAutoSave();
    };

    const handleCopyMarkdown = async () => {
        const html = editorRef.current?.innerHTML || project.notes || '';
        const md = htmlToMarkdown(html);
        await navigator.clipboard.writeText(md);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        // Use browser native find within page
        (window as typeof window & { find: (term: string, caseSens?: boolean, backward?: boolean, wrap?: boolean) => boolean }).find(searchTerm, false, false, true);
    };

    const getCurrentHtml = () => {
        if (isEditMode && editorRef.current) return editorRef.current.innerHTML;
        return project.notes || '';
    };
    const { words, chars } = countWords(getCurrentHtml());

    const lastSavedLabel = lastSaved
        ? `Saved ${Math.round((Date.now() - lastSaved.getTime()) / 1000)}s ago`
        : null;

    // ── Toolbar button helper ──
    const ToolBtn = ({ onClick, title, active, children }: {
        onClick: () => void; title: string; active?: boolean; children: React.ReactNode;
    }) => (
        <button
            type="button" title={title} onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className={`p-1.5 rounded-lg transition-all text-sm flex items-center justify-center ${active
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
        >
            {children}
        </button>
    );

    const isEditModeEnabled = isEditMode && canEdit;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Notes Header */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 p-5"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(99,102,241,0.06))' }}
            >
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.12)' }} />
                <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(99,102,241,0.2))', border: '1px solid rgba(6,182,212,0.3)' }}
                        >
                            <StickyNote className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold gradient-text">Project Notes</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Rich-text notes with auto-save · {words} words · {chars} chars</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Search toggle */}
                        <button
                            onClick={() => setShowSearch(s => !s)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${showSearch ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-border text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            <Search className="w-3.5 h-3.5" /> Find
                        </button>
                        {/* Copy Markdown */}
                        <button
                            onClick={handleCopyMarkdown}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy MD'}
                        </button>
                        {/* Edit / Read toggle */}
                        {canEdit && (
                            <button
                                onClick={() => setIsEditMode(e => !e)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${isEditMode
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-white/5'
                                    }`}
                            >
                                {isEditMode ? <><Save className="w-3.5 h-3.5" /> Editing</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 overflow-hidden"
                    >
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/5">
                            <Search className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <input
                                autoFocus
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Search in notes… (Enter to jump)"
                                className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-semibold hover:bg-amber-500/25 transition-all"
                        >
                            Find
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Editor / Reader */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Toolbar — only visible in edit mode */}
                <AnimatePresence>
                    {isEditModeEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 border-b border-border bg-muted/30">
                                {/* Text formatting */}
                                <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('formatBlock', 'code')} title="Inline Code">
                                    <Code className="w-3.5 h-3.5" />
                                </ToolBtn>

                                <div className="w-px h-5 bg-border mx-0.5" />

                                {/* Headings */}
                                <ToolBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('formatBlock', 'p')} title="Paragraph"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>

                                <div className="w-px h-5 bg-border mx-0.5" />

                                {/* Lists */}
                                <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet List"><List className="w-3.5 h-3.5" /></ToolBtn>
                                <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>

                                <div className="w-px h-5 bg-border mx-0.5" />

                                {/* Code block */}
                                <ToolBtn
                                    onClick={() => insertHTML('<pre style="background:rgba(0,0,0,0.4);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:12px 14px;font-family:JetBrains Mono,monospace;font-size:12px;overflow-x:auto;margin:8px 0"><code>// code here</code></pre><p><br></p>')}
                                    title="Code Block"
                                >
                                    <Terminal className="w-3.5 h-3.5" />
                                </ToolBtn>

                                {/* Highlight picker */}
                                <div className="relative">
                                    <ToolBtn
                                        onClick={() => setShowHighlightPicker(p => !p)}
                                        title="Highlight Text"
                                        active={showHighlightPicker}
                                    >
                                        <Highlighter className="w-3.5 h-3.5" />
                                    </ToolBtn>
                                    {showHighlightPicker && (
                                        <div className="absolute top-full left-0 mt-1.5 z-20 flex gap-1.5 p-2 rounded-xl border border-border bg-card shadow-xl">
                                            {HIGHLIGHT_COLORS.map(c => (
                                                <button
                                                    key={c.name}
                                                    title={c.name}
                                                    onMouseDown={(e) => { e.preventDefault(); applyHighlight(c); }}
                                                    className="w-6 h-6 rounded-md border-2 transition-transform hover:scale-110"
                                                    style={{ background: c.bg, borderColor: c.border }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1" />

                                {/* Status */}
                                <div className="flex items-center gap-1.5 text-[11px]">
                                    {saveStatus === 'saving' && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                                        </span>
                                    )}
                                    {saveStatus === 'saved' && (
                                        <span className="flex items-center gap-1 text-green-400">
                                            <Check className="w-3 h-3" /> Saved
                                        </span>
                                    )}
                                    {saveStatus === 'idle' && lastSavedLabel && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="w-3 h-3" /> {lastSavedLabel}
                                        </span>
                                    )}
                                    <span className="ml-2 text-muted-foreground">{words}w · {chars}c</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Editor / Read view */}
                {isEditModeEnabled ? (
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={scheduleAutoSave}
                        className="min-h-[420px] p-5 focus:outline-none text-sm leading-relaxed notes-editor"
                        style={{ wordBreak: 'break-word' }}
                    />
                ) : (
                    <div className="min-h-[420px] p-5">
                        {project.notes ? (
                            <div
                                className="notes-read-view prose-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: project.notes }}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                                    <StickyNote className="w-7 h-7 text-cyan-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-1">No notes yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {canEdit ? 'Click Edit to start writing project notes with rich formatting.' : 'No notes added yet.'}
                                </p>
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> Start Writing
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer info bar */}
                {!isEditModeEnabled && project.notes && (
                    <div className="px-5 py-2.5 border-t border-border bg-muted/20 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <BookOpen className="w-3 h-3" />
                        <span>{words} words · {chars} characters</span>
                        {canEdit && (
                            <button onClick={() => setIsEditMode(true)} className="ml-auto flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                <Pencil className="w-3 h-3" /> Edit
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Project Detail Page ─────────────────────────────────────────────────
export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const { user } = useAuthStore();

    const [project, setProject] = useState<Project | null>(null);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddCredential, setShowAddCredential] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [activeTab, setActiveTab] = useState<'credentials' | 'members' | 'download' | 'notes' | 'activity'>('credentials');
    const [downloading, setDownloading] = useState(false);
    const [selectedCredIds, setSelectedCredIds] = useState<Set<string>>(new Set());
    const [revealCache, setRevealCache] = useState<Record<string, Record<string, string>>>({});
    const [activityLogs, setActivityLogs] = useState<import('@/types').ActivityLog[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);

    const toggleCred = (id: string) => setSelectedCredIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const selectAll = () => setSelectedCredIds(new Set(credentials.map(c => c._id)));
    const clearAll = () => setSelectedCredIds(new Set());

    const handleDownloadPDF = async () => {
        if (!project || selectedCredIds.size === 0) return;
        setDownloading(true);
        try {
            // Reveal selected credentials
            const newCache = { ...revealCache };
            await Promise.all(
                credentials
                    .filter(c => selectedCredIds.has(c._id) && !newCache[c._id])
                    .map(async (c) => {
                        try {
                            const res = await credentialService.reveal(projectId, c._id);
                            newCache[c._id] = res.data.data?.data || {};
                        } catch { newCache[c._id] = {}; }
                    })
            );
            setRevealCache(newCache);

            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210; const PL = 18; const PR = 18; const CW = W - PL - PR; let y = 0;

            // ── CRITICAL FIX: newPage always sets full dark background ──
            const newPage = () => {
                doc.addPage();
                doc.setFillColor(10, 10, 22);
                doc.rect(0, 0, W, 297, 'F');
                doc.setFillColor(99, 102, 241);
                doc.rect(0, 0, 4, 297, 'F');
                y = 22;
                return doc;
            };

            const addFooter = () => {
                doc.setFillColor(8, 8, 18);
                doc.rect(0, 284, W, 13, 'F');
                doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.3);
                doc.line(PL, 284, W - PR, 284);
                doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 120);
                doc.text('Confidential · Generated by Docify', PL, 291);
                doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W - PR, 291, { align: 'right' });
            };

            const addPageIfNeeded = (h: number) => {
                if (y + h > 272) { addFooter(); newPage(); }
            };

            // ── COVER PAGE ────────────────────────────────────────────────
            doc.setFillColor(10, 10, 22);
            doc.rect(0, 0, W, 297, 'F');
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 0, 4, 297, 'F');
            doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.5);
            doc.line(PL, 80, W - PR, 80);

            doc.setTextColor(99, 102, 241); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            doc.text('PROJECT DOCUMENTATION', PL, 72);
            doc.setTextColor(255, 255, 255); doc.setFontSize(28); doc.setFont('helvetica', 'bold');
            const nameLines = doc.splitTextToSize(project.name, CW) as string[];
            doc.text(nameLines, PL, 96);
            y = 96 + nameLines.length * 12;

            if (project.description) {
                doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 190);
                const dl = doc.splitTextToSize(project.description, CW) as string[];
                doc.text(dl, PL, y + 6); y += 6 + dl.length * 6;
            }

            // Meta pills
            y += 12;
            const metas = [
                { label: 'MEMBERS', val: String(project.members.length) },
                { label: 'CREDENTIALS', val: String(selectedCredIds.size) },
                { label: 'OWNER', val: project.members.find(m => m.role === 'OWNER')?.user.name || '' },
            ];
            let mx = PL;
            metas.forEach(m => {
                doc.setFillColor(22, 22, 48); doc.roundedRect(mx, y, 50, 14, 3, 3, 'F');
                doc.setDrawColor(55, 58, 110); doc.setLineWidth(0.25); doc.roundedRect(mx, y, 50, 14, 3, 3, 'S');
                doc.setTextColor(99, 102, 241); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                doc.text(m.label, mx + 25, y + 4.5, { align: 'center' });
                doc.setTextColor(220, 220, 250); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
                doc.text(m.val, mx + 25, y + 10.5, { align: 'center' });
                mx += 56;
            });

            // Project URLs on cover
            let urlY = y + 20;
            if (project.frontendUrl) {
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241);
                doc.text('FRONTEND URL', PL, urlY);
                doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 220);
                doc.text(project.frontendUrl.length > 55 ? project.frontendUrl.slice(0, 52) + '...' : project.frontendUrl, PL + 36, urlY);
                urlY += 8;
            }
            if (project.backendUrl) {
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(139, 92, 246);
                doc.text('BACKEND URL', PL, urlY);
                doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 220);
                doc.text(project.backendUrl.length > 55 ? project.backendUrl.slice(0, 52) + '...' : project.backendUrl, PL + 36, urlY);
                urlY += 8;
            }
            if (project.notes) {
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(6, 182, 212);
                doc.text('NOTES', PL, urlY);
                doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 190);
                const noteLines = doc.splitTextToSize(project.notes, CW - 36) as string[];
                doc.text(noteLines.slice(0, 3), PL + 36, urlY);
            }

            // Cover bottom bar
            doc.setFillColor(18, 18, 42); doc.rect(0, 252, W, 45, 'F');
            doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.3); doc.line(PL, 258, W - PR, 258);
            doc.setTextColor(60, 60, 110); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
            doc.text('CONFIDENTIAL — For authorized recipients only', PL, 265);
            doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, PL, 272);

            // ── PAGE 2: TEAM MEMBERS ──────────────────────────────────────
            newPage();

            doc.setTextColor(99, 102, 241); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.text('TEAM MEMBERS', PL, y); y += 8;
            doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.4);
            doc.line(PL, y, W - PR, y); y += 6;

            doc.setFillColor(18, 18, 46); doc.rect(PL, y, CW, 8, 'F');
            doc.setTextColor(99, 102, 241); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
            doc.text('NAME', PL + 3, y + 5.5); doc.text('EMAIL', PL + 55, y + 5.5); doc.text('ROLE', W - PR - 16, y + 5.5);
            y += 10;

            project.members.forEach((m, idx) => {
                addPageIfNeeded(10);
                doc.setFillColor(idx % 2 === 0 ? 14 : 18, idx % 2 === 0 ? 14 : 18, idx % 2 === 0 ? 30 : 36);
                doc.rect(PL, y, CW, 10, 'F');
                doc.setTextColor(220, 220, 240); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
                doc.text(m.user.name, PL + 3, y + 6.5);
                doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 170); doc.setFontSize(8);
                doc.text(m.user.email, PL + 55, y + 6.5);
                const rc = m.role === 'OWNER' ? [245, 158, 11] : m.role === 'ADMIN' ? [99, 102, 241] : [100, 116, 139];
                doc.setFillColor(rc[0], rc[1], rc[2]);
                doc.roundedRect(W - PR - 20, y + 1.5, 18, 7, 2, 2, 'F');
                doc.setTextColor(255, 255, 255); doc.setFontSize(7);
                doc.text(m.role, W - PR - 11, y + 6.5, { align: 'center' });
                y += 11;
            });
            addFooter();

            // ── ENVIRONMENT-GROUPED CREDENTIAL PAGES ─────────────────────
            const envConfig: Record<string, { label: string; r: number; g: number; b: number }> = {
                LOCAL: { label: 'LOCAL', r: 148, g: 163, b: 184 },
                DEVELOPMENT: { label: 'DEVELOPMENT', r: 59, g: 130, b: 246 },
                STAGE: { label: 'STAGE', r: 245, g: 158, b: 11 },
                PRODUCTION: { label: 'PRODUCTION', r: 239, g: 68, b: 68 },
            };

            const orderedEnvs = ['LOCAL', 'DEVELOPMENT', 'STAGE', 'PRODUCTION'];
            const selectedList = credentials.filter(c => selectedCredIds.has(c._id));

            orderedEnvs.forEach(envKey => {
                const ec = envConfig[envKey];
                const envCreds = selectedList.filter(c => (c.environment || 'PRODUCTION') === envKey);
                if (envCreds.length === 0) return;

                // Environment section page
                newPage();
                // Environment color accent (overrides indigo left bar)
                doc.setFillColor(ec.r, ec.g, ec.b);
                doc.rect(0, 0, 4, 297, 'F');

                doc.setTextColor(ec.r, ec.g, ec.b); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
                doc.text(`${ec.label} ENVIRONMENT`, PL, y); y += 8;
                doc.setDrawColor(ec.r, ec.g, ec.b); doc.setLineWidth(0.4);
                doc.line(PL, y, W - PR, y); y += 8;

                envCreds.forEach((cred) => {
                    addPageIfNeeded(40);

                    // Credential header card
                    doc.setFillColor(16, 16, 38);
                    doc.roundedRect(PL, y, CW, 24, 3, 3, 'F');
                    doc.setFillColor(ec.r, ec.g, ec.b);
                    doc.roundedRect(PL, y, 3, 24, 1, 1, 'F');
                    doc.setDrawColor(50, 52, 100); doc.setLineWidth(0.25);
                    doc.roundedRect(PL, y, CW, 24, 3, 3, 'S');

                    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                    doc.text(`${CREDENTIAL_ICONS[cred.type] || ''} ${cred.title}`, PL + 6, y + 9);

                    // Type + environment badges
                    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
                    doc.setFillColor(40, 40, 80); doc.roundedRect(PL + 6, y + 13, 30, 6, 1, 1, 'F');
                    doc.setTextColor(180, 185, 255); doc.text(cred.type.replace('_', ' '), PL + 21, y + 17.5, { align: 'center' });

                    doc.setFillColor(Math.min(ec.r, 50), Math.min(ec.g, 50), Math.min(ec.b, 50));
                    doc.roundedRect(PL + 38, y + 13, 26, 6, 1, 1, 'F');
                    doc.setTextColor(ec.r, ec.g, ec.b); doc.text(ec.label, PL + 51, y + 17.5, { align: 'center' });

                    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 160);
                    doc.text(`by ${cred.createdBy?.name || 'Unknown'}  ·  ${formatRelativeTime(cred.createdAt)}`, PL + 6, y + 21);
                    y += 28;

                    // Key-value table
                    const kvData = newCache[cred._id] || {};
                    const keys = Object.keys(kvData);

                    if (keys.length === 0) {
                        doc.setTextColor(100, 100, 150); doc.setFontSize(8.5);
                        doc.text('No decrypted data available.', PL + 3, y + 7);
                        y += 14;
                    } else {
                        // Table header
                        doc.setFillColor(18, 18, 48); doc.rect(PL, y, CW, 8, 'F');
                        doc.setTextColor(ec.r, ec.g, ec.b); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                        doc.text('KEY', PL + 3, y + 5.5);
                        doc.text('VALUE', PL + 80, y + 5.5);
                        y += 10;

                        keys.forEach((key, idx) => {
                            addPageIfNeeded(12);
                            // On new page, re-stamp env accent
                            if (y === 22) {
                                doc.setFillColor(ec.r, ec.g, ec.b);
                                doc.rect(0, 0, 4, 297, 'F');
                            }
                            const val = String(kvData[key] || '');
                            const rowH = 12;
                            doc.setFillColor(idx % 2 === 0 ? 13 : 17, idx % 2 === 0 ? 13 : 17, idx % 2 === 0 ? 28 : 35);
                            doc.rect(PL, y, CW, rowH, 'F');
                            // Left key accent
                            doc.setFillColor(ec.r, ec.g, ec.b);
                            doc.rect(PL, y, 2, rowH, 'F');
                            doc.setFont('courier', 'bold'); doc.setFontSize(8); doc.setTextColor(170, 175, 255);
                            doc.text(key, PL + 5, y + 7.5);
                            // Value
                            doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(215, 215, 235);
                            const valT = val.length > 58 ? val.slice(0, 55) + '...' : val;
                            doc.text(valT, PL + 80, y + 7.5);
                            doc.setDrawColor(28, 28, 52); doc.setLineWidth(0.15);
                            doc.line(PL, y + rowH, PL + CW, y + rowH);
                            y += rowH;
                        });
                    }
                    y += 5;
                });
                addFooter();
            });

            doc.save(`${project.name.replace(/\s+/g, '-').toLowerCase()}-documentation.pdf`);
        } catch (err) { console.error(err); } finally { setDownloading(false); }
    };

    const userMember = project?.members.find((m) => m.user._id === user?._id);
    const userRole = userMember?.role || 'MEMBER';

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    projectService.getById(projectId),
                    credentialService.getAll(projectId),
                ]);
                setProject(pRes.data.data!);
                setCredentials(cRes.data.data || []);
            } catch { router.replace('/dashboard'); }
            setLoading(false);
        };
        if (projectId) load();
    }, [projectId, router]);

    useEffect(() => {
        if (activeTab === 'activity' && projectId) {
            setLoadingActivity(true);
            projectService.getActivityLog(projectId)
                .then(res => setActivityLogs((res.data.data as any) || []))
                .finally(() => setLoadingActivity(false));
        }
    }, [activeTab, projectId]);

    const handleDeleteCredential = async (id: string) => {
        if (!confirm('Are you sure you want to delete this credential?')) return;
        await credentialService.delete(projectId, id);
        setCredentials(c => c.filter(cr => cr._id !== id));
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const res = await projectService.addMember(projectId, { email: inviteEmail, role: 'MEMBER' });
            setProject(res.data.data!);
            setInviteEmail('');
            setShowInviteModal(false);
        } catch { }
        setInviting(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
    );

    if (!project) return null;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Hero Header */}
            <div className="relative rounded-2xl overflow-hidden mb-8 p-6 border border-indigo-500/20" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)' }}>
                {/* Floating orbs */}
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl animate-orb" style={{ background: 'rgba(139,92,246,0.2)' }} />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-2xl animate-float" style={{ background: 'rgba(6,182,212,0.15)' }} />
                <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full blur-2xl animate-float-reverse" style={{ background: 'rgba(99,102,241,0.15)' }} />

                <div className="relative flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start gap-4 flex-1 w-full">
                        <Link href="/dashboard">
                            <button className="mt-1 p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all border border-white/10 flex-shrink-0">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">Project</span>
                            </div>
                            <h1 className="text-2xl font-bold gradient-text truncate">{project.name}</h1>
                            {project.description && <p className="text-muted-foreground text-sm mt-1 max-w-xl">{project.description}</p>}
                            <div className="flex items-center gap-2 sm:gap-3 mt-3 flex-wrap">
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
                                    <Users className="w-3 h-3" />{project.members.length} members
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
                                    <Key className="w-3 h-3" />{credentials.length} credentials
                                </span>
                                <span className="tag-pill" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                    {userRole === 'OWNER' && <Crown className="w-2.5 h-2.5 mr-1" />}{userRole}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => setShowInviteModal(true)}
                                className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-3.5 py-2.5 sm:py-2 border border-white/15 rounded-xl text-sm hover:bg-white/10 transition-all text-foreground"
                            ><UserPlus className="w-4 h-4" /> Invite</motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }} whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAddCredential(true)}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25"
                        ><Plus className="w-4 h-4" /> Add Credential</motion.button>
                    </div>
                </div>
            </div>

            {/* Project Metadata Bar */}
            {(project.frontendUrl || project.backendUrl || project.notes) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {project.frontendUrl && (
                        <a href={project.frontendUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Frontend URL</p>
                                <p className="text-xs text-foreground truncate group-hover:text-indigo-400 transition-colors">{project.frontendUrl}</p>
                            </div>
                        </a>
                    )}
                    {project.backendUrl && (
                        <a href={project.backendUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-violet-500/30 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                <Server className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Backend URL</p>
                                <p className="text-xs text-foreground truncate group-hover:text-violet-400 transition-colors">{project.backendUrl}</p>
                            </div>
                        </a>
                    )}
                    {project.notes && (
                        <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                <StickyNote className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
                                <p className="text-xs text-foreground line-clamp-2">{project.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/50 border border-border mb-6 w-full sm:w-fit overflow-x-auto scrollbar-none">
                {([
                    { id: 'credentials', label: 'Credentials', count: credentials.length, icon: Key },
                    { id: 'members', label: 'Members', count: project.members.length, icon: Users },
                    { id: 'activity', label: 'Activity', count: null, icon: Clock },
                    { id: 'notes', label: 'Notes', count: null, icon: StickyNote },
                    { id: 'download', label: 'Download', count: null, icon: Download },
                ] as const).map(tab => (
                    <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30" />
                        )}
                        <tab.icon className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                        {tab.count !== null && (
                            <span className={`relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                }`}>{tab.count}</span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'credentials' ? (
                credentials.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                            <Key className="w-7 h-7 text-indigo-400" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">No credentials yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Add your first encrypted credential to this project.</p>
                        <button onClick={() => setShowAddCredential(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition-colors">
                            Add Credential
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {ENVIRONMENTS.map(env => {
                            const envCreds = credentials.filter(c => (c.environment || 'PRODUCTION') === env.value);
                            if (envCreds.length === 0) return null;
                            return (
                                <div key={env.value}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Layers className="w-3.5 h-3.5" style={{ color: env.color }} />
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: env.color }}>{env.label}</span>
                                        <div className="flex-1 h-px" style={{ background: `${env.color}30` }} />
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: env.bg, color: env.color }}>{envCreds.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {envCreds.map(c => (
                                            <CredentialCard
                                                key={c._id}
                                                credential={c}
                                                projectId={projectId}
                                                userRole={userRole}
                                                onDelete={handleDeleteCredential}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : activeTab === 'members' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {project.members.map((member, i) => (
                        <motion.div key={member.user._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-indigo-500/20 transition-all group"
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20">
                                    {member.user.name?.charAt(0).toUpperCase()}
                                </div>
                                {member.role === 'OWNER' && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center"><Crown className="w-2 h-2 text-yellow-900" /></div>}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-foreground text-sm">{member.user.name}</p>
                                <p className="text-xs text-muted-foreground">{member.user.email}</p>
                            </div>
                            <span className={`tag-pill ${member.role === 'OWNER' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' :
                                member.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' :
                                    'bg-muted text-muted-foreground border-border'
                                }`}>{member.role}</span>
                            {(userRole === 'OWNER' || userRole === 'ADMIN') && member.role !== 'OWNER' && (
                                <button onClick={async () => {
                                    if (!confirm('Remove this member?')) return;
                                    await projectService.removeMember(projectId, member.user._id);
                                    setProject(p => p ? { ...p, members: p.members.filter(m => m.user._id !== member.user._id) } : p);
                                }} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            ) : activeTab === 'notes' ? (
                <NotesTab
                    project={project}
                    projectId={projectId}
                    canEdit={userRole === 'OWNER' || userRole === 'ADMIN'}
                    onSaved={(html) => setProject(p => p ? { ...p, notes: html } : p)}
                />
            ) : activeTab === 'activity' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 p-5"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                                <Clock className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold gradient-text">Project Activity</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Recent actions and audit logs for this project</p>
                            </div>
                        </div>
                    </div>

                    {loadingActivity ? (
                        <div className="grid grid-cols-1 gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />
                            ))}
                        </div>
                    ) : activityLogs.length === 0 ? (
                        <div className="text-center py-20 bg-card border border-border rounded-2xl">
                            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activityLogs.map((log, i) => {
                                const actionColors: Record<string, string> = {
                                    PROJECT_CREATED: 'bg-green-500/20 text-green-400',
                                    PROJECT_UPDATED: 'bg-blue-500/20 text-blue-400',
                                    MEMBER_ADDED: 'bg-indigo-500/20 text-indigo-400',
                                    MEMBER_REMOVED: 'bg-orange-500/20 text-orange-400',
                                    CREDENTIAL_CREATED: 'bg-violet-500/20 text-violet-400',
                                    CREDENTIAL_UPDATED: 'bg-yellow-500/20 text-yellow-400',
                                    CREDENTIAL_DELETED: 'bg-red-500/20 text-red-400',
                                    CREDENTIAL_REVEALED: 'bg-cyan-500/20 text-cyan-400',
                                };
                                return (
                                    <motion.div
                                        key={log._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-indigo-500/10 transition-all"
                                    >
                                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${actionColors[log.action] || 'bg-gray-500/20 text-gray-400'}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground font-semibold">{log.user?.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{log.user?.email}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-1">{formatRelativeTime(log.createdAt)}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            ) : (
                /* Download Tab */
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Header card */}
                    <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 p-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))' }}>
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.15)' }} />
                        <div className="relative flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))', border: '1px solid rgba(99,102,241,0.35)' }}>
                                <FileText className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold gradient-text">Export Project Documentation</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Select credentials below, then generate a professional PDF — including real decrypted values for client handover.</p>
                            </div>
                        </div>
                    </div>

                    {/* Credential selector */}
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                            <span className="text-sm font-semibold text-foreground">Select Credentials to Include</span>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Select All</button>
                                <span className="text-muted-foreground">·</span>
                                <button onClick={clearAll} className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                            </div>
                        </div>
                        {credentials.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No credentials in this project yet.</p>
                        ) : (
                            <div className="divide-y divide-border">
                                {credentials.map((c) => {
                                    const isSelected = selectedCredIds.has(c._id);
                                    const glow = GLOW_COLORS[c.type] || '107,114,128';
                                    return (
                                        <motion.button key={c._id} onClick={() => toggleCred(c._id)}
                                            whileHover={{ backgroundColor: 'rgba(99,102,241,0.04)' }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${isSelected ? 'bg-indigo-500/5' : ''}`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-muted-foreground/30'
                                                }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            {/* Icon */}
                                            <span className="text-xl flex-shrink-0">{CREDENTIAL_ICONS[c.type]}</span>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                                                <p className="text-[11px] text-muted-foreground">{c.keyCount} keys · {formatRelativeTime(c.createdAt)}</p>
                                            </div>
                                            {/* Type badge */}
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `rgba(${glow},0.15)`, color: `rgb(${glow})`, border: `1px solid rgba(${glow},0.3)` }}>
                                                {c.type.replace('_', ' ')}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Download button */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                        <div>
                            <p className="text-sm font-semibold text-foreground">{selectedCredIds.size} credential{selectedCredIds.size !== 1 ? 's' : ''} selected</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Real decrypted values will be included · Share with care</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(99,102,241,0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleDownloadPDF}
                            disabled={downloading || selectedCredIds.size === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {downloading ? 'Generating...' : 'Download PDF'}
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Add Credential Modal */}
            <AnimatePresence>
                {showAddCredential && (
                    <AddCredentialModal
                        projectId={projectId}
                        onClose={() => setShowAddCredential(false)}
                        onAdd={c => setCredentials(prev => [c, ...prev])}
                    />
                )}
            </AnimatePresence>

            {/* Invite Member Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInviteModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                            <h2 className="text-lg font-bold text-foreground mb-5">Invite Team Member</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                                    <button onClick={handleInvite} disabled={inviting || !inviteEmail} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                        {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Send Invite
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
