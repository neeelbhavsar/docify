'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function Orb({ className }: { className: string }) {
    return (
        <motion.div
            className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

function ResetPasswordFormContent() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const setAuth = useAuthStore((s) => s.setAuth);

    const resetForm = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing password reset token.');
        }
    }, [token]);

    const handleReset = async (data: ResetPasswordForm) => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await authService.resetPassword(token, data.password);
            const { user, accessToken, refreshToken } = res.data.data!;
            setAuth(user, accessToken, refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Password reset failed. Token may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Invalid or missing password reset token.
                    </motion.div>
                </AnimatePresence>
                <button
                    onClick={() => router.push('/auth')}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div className="relative z-10 w-full max-w-md mx-4">
            <div className="glass rounded-2xl p-8 shadow-2xl shadow-indigo-900/30">
                <div className="text-center mb-8">
                    <motion.div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/30"
                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                    >
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                    <p className="text-slate-400 text-sm mt-1">Enter your new secure password</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`w-full bg-white/5 border rounded-lg py-2.5 text-white placeholder-slate-500 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 pl-10 pr-10 ${resetForm.formState.errors.password ? 'border-red-500/50' : 'border-white/10'
                                    }`}
                                placeholder="••••••••"
                                {...resetForm.register('password')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </span>
                        </div>
                        {resetForm.formState.errors.password && (
                            <p className="text-red-400 text-xs mt-1">{resetForm.formState.errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                type="password"
                                className={`w-full bg-white/5 border rounded-lg py-2.5 text-white placeholder-slate-500 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 pl-10 pr-4 ${resetForm.formState.errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                                    }`}
                                placeholder="Repeat new password"
                                {...resetForm.register('confirmPassword')}
                            />
                        </div>
                        {resetForm.formState.errors.confirmPassword && (
                            <p className="text-red-400 text-xs mt-1">{resetForm.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Reset Password
                    </motion.button>
                </form>

                <p className="text-center text-slate-400 text-sm mt-6">
                    <button
                        onClick={() => router.push('/auth')}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                        Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#07080e]">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-violet-950/60" />

            {/* Floating orbs */}
            <Orb className="w-96 h-96 bg-indigo-600 -top-20 -left-20" />
            <Orb className="w-80 h-80 bg-violet-600 -bottom-10 -right-10" />
            <Orb className="w-64 h-64 bg-cyan-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            <Suspense
                fallback={
                    <div className="flex items-center justify-center min-h-screen">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                }
            >
                <ResetPasswordFormContent />
            </Suspense>
        </div>
    );
}
