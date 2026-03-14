'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Shield, User, Lock } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuthStore();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
            </div>

            <div className="space-y-4">
                {/* Profile Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <User className="w-5 h-5 text-indigo-400" />
                        <h2 className="font-semibold text-foreground">Profile</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Display Name</label>
                            <input defaultValue={user?.name} className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
                            <input defaultValue={user?.email} disabled className="w-full px-3 py-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground cursor-not-allowed" />
                        </div>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                            Save Changes
                        </button>
                    </div>
                </motion.div>

                {/* Security Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <h2 className="font-semibold text-foreground">Security</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Current Password</label>
                            <input type="password" className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">New Password</label>
                            <input type="password" className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                            Change Password
                        </button>
                    </div>
                </motion.div>

                {/* Encryption info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-foreground text-sm">AES-256-CBC Encryption</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                All credentials are encrypted with AES-256-CBC before being stored in the database.
                                Values are never transmitted or stored in plain text. Only authorized project members can reveal secrets.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
