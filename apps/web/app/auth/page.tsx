'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = loginSchema.extend({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// Animated floating orb
function Orb({ className }: { className: string }) {
    return (
        <motion.div
            className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
    const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    const handleLogin = async (data: LoginForm) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await authService.login(data);
            const { user, accessToken, refreshToken } = res.data.data!;
            setAuth(user, accessToken, refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (data: RegisterForm) => {
        setIsLoading(true);
        setError('');
        try {
            const { confirmPassword, ...payload } = data;
            const res = await authService.register(payload);
            const { user, accessToken, refreshToken } = res.data.data!;
            setAuth(user, accessToken, refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode((m) => (m === 'login' ? 'register' : 'login'));
        setError('');
        loginForm.reset();
        registerForm.reset();
    };

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

            {/* Auth card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="glass rounded-2xl p-8 shadow-2xl shadow-indigo-900/30">
                    {/* Logo / Title */}
                    <div className="text-center mb-8">
                        <motion.div
                            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/30"
                            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                        >
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white">DevVault</h1>
                        <p className="text-slate-400 text-sm mt-1">Secure Project Credential Manager</p>
                    </div>

                    {/* Mode toggle tabs */}
                    <div className="flex rounded-xl bg-white/5 p-1 mb-8">
                        {(['login', 'register'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${mode === m
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {m === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Forms */}
                    <AnimatePresence mode="wait">
                        {mode === 'login' ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={loginForm.handleSubmit(handleLogin)}
                                className="space-y-4"
                            >
                                <InputField
                                    label="Email"
                                    type="email"
                                    icon={<Mail className="w-4 h-4" />}
                                    placeholder="you@company.com"
                                    error={loginForm.formState.errors.email?.message}
                                    {...loginForm.register('email')}
                                />
                                <InputField
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    icon={<Lock className="w-4 h-4" />}
                                    placeholder="••••••••"
                                    error={loginForm.formState.errors.password?.message}
                                    endIcon={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                    {...loginForm.register('password')}
                                />
                                <SubmitButton isLoading={isLoading} label="Sign In" />
                            </motion.form>
                        ) : (
                            <motion.form
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={registerForm.handleSubmit(handleRegister)}
                                className="space-y-4"
                            >
                                <InputField
                                    label="Full Name"
                                    type="text"
                                    icon={<User className="w-4 h-4" />}
                                    placeholder="John Doe"
                                    error={registerForm.formState.errors.name?.message}
                                    {...registerForm.register('name')}
                                />
                                <InputField
                                    label="Email"
                                    type="email"
                                    icon={<Mail className="w-4 h-4" />}
                                    placeholder="you@company.com"
                                    error={registerForm.formState.errors.email?.message}
                                    {...registerForm.register('email')}
                                />
                                <InputField
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    icon={<Lock className="w-4 h-4" />}
                                    placeholder="Min. 8 characters"
                                    error={registerForm.formState.errors.password?.message}
                                    endIcon={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                    {...registerForm.register('password')}
                                />
                                <InputField
                                    label="Confirm Password"
                                    type="password"
                                    icon={<Lock className="w-4 h-4" />}
                                    placeholder="Repeat password"
                                    error={registerForm.formState.errors.confirmPassword?.message}
                                    {...registerForm.register('confirmPassword')}
                                />
                                <SubmitButton isLoading={isLoading} label="Create Account" />
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-slate-400 text-sm mt-6">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button onClick={toggleMode} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            {mode === 'login' ? 'Sign up free' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// Reusable Input component
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: ReactNode;
    endIcon?: ReactNode;
    error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, icon, endIcon, error, ...props }, ref) => (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
                )}
                <input
                    ref={ref}
                    className={`w-full bg-white/5 border rounded-lg py-2.5 text-white placeholder-slate-500 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 ${icon ? 'pl-10' : 'pl-4'
                        } ${endIcon ? 'pr-10' : 'pr-4'} ${error ? 'border-red-500/50' : 'border-white/10'
                        }`}
                    {...props}
                />
                {endIcon && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                        {endIcon}
                    </span>
                )}
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    )
);
InputField.displayName = 'InputField';

function SubmitButton({ isLoading, label }: { isLoading: boolean; label: string }) {
    return (
        <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {label}
        </motion.button>
    );
}
