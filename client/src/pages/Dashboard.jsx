import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../components/ui';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Calendar, ExternalLink, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();

    const { data: contributions = [], isLoading, error } = useQuery({
        queryKey: ['myContributions', user?.id],
        queryFn: async () => {
            const res = await api.get('/my-contributions');
            return res.data;
        },
        enabled: !!user,
    });

    const totalImpact = contributions.reduce((acc, curr) => acc + (curr.amount / 100), 0);
    const successCount = contributions.filter(c => c.status === 'succeeded').length;

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Spinner className="w-12 h-12" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Impact Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4">
                <div className="premium-card p-6 bg-red-50/50 border-red-100 border text-red-600 font-bold flex items-center gap-3">
                    <ShieldCheck size={20} />
                    {error instanceof Error ? error.message : "Infrastructure synchronization delayed."}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Member Node</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">Your Global Impact</h1>
                    <p className="mt-2 text-slate-500 font-medium">Monitoring your contributions to the community ecosystem.</p>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <Award size={20} />
                    </div>
                    <div className="pr-4">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Status</div>
                        <div className="text-sm font-bold text-indigo-900">Verified Contributor</div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Impact', value: `€${totalImpact.toFixed(2)}`, icon: Heart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Verified Cycles', value: successCount, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Next Cycle', value: '7 Days', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="premium-card p-8 glass border-white/50"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                                <TrendingUp size={12} />
                                +12%
                            </span>
                        </div>
                        <div className="mt-6">
                            <div className="text-4xl font-black text-slate-900">{stat.value}</div>
                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Activity List */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Contribution History
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 uppercase tracking-widest">{contributions.length}</span>
                    </h3>
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        Export Ledger
                        <ExternalLink size={14} />
                    </button>
                </div>

                <div className="premium-card glass overflow-hidden border-white/50">
                    <AnimatePresence mode="wait">
                        {contributions.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-24 px-6 flex flex-col items-center gap-4"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center">
                                    <ShieldCheck size={40} />
                                </div>
                                <div className="max-w-xs">
                                    <h3 className="text-lg font-bold text-slate-900">No data detected</h3>
                                    <p className="mt-1 text-sm text-slate-500 font-medium">
                                        The community awaits your first impact cycle. Start now on the dashboard.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <ul className="divide-y divide-slate-100/50">
                                {contributions.map((contribution, idx) => (
                                    <motion.li 
                                        key={contribution.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 + 0.5 }}
                                        className="p-6 transition-all hover:bg-slate-50/50 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <ArrowUpRight size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl font-black text-slate-900">
                                                            €{(contribution.amount / 100).toFixed(2)}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                            contribution.status === 'succeeded' 
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                            {contribution.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                        {new Date(contribution.created_at).toLocaleDateString('en-US', { 
                                                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="text-xs font-mono text-slate-300 group-hover:text-slate-500 transition-colors">
                                                    TXN_{contribution.payment_intent_id.substring(3, 15).toUpperCase()}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                    <ShieldCheck size={12} className="text-emerald-500" />
                                                    Verified Ledger
                                                </div>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
