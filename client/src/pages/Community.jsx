import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Spinner, Card } from '../components/ui';
import api from '../lib/api';
import { useEffect } from 'react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Community() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['communityStats', user?.id], // re-fetch if user changes
        queryFn: async () => {
            const res = await api.get('/community-stats');
            return res.data;
        }
    });

    const stats = data?.stats;
    const recent = data?.recent || [];

    // Listen for real-time WebSocket updates
    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('stats_updated', () => {
             // Invalidate the cache to trigger an immediate background refetch when someone donates
            queryClient.invalidateQueries({ queryKey: ['communityStats'] });
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
                <Spinner className="w-8 h-8 text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-inset ring-red-500/10 text-center">
                    {error instanceof Error ? error.message : "Unable to load community statistics right now."}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Collective Impact</h2>
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
                    <p className="relative mt-2 text-6xl font-extrabold text-slate-900 tracking-tight sm:text-7xl lg:text-8xl">
                        €{((stats?.total_amount || 0) / 100).toFixed(2)}
                    </p>
                </div>
                <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                    raised together by <span className="text-indigo-600 font-semibold">{stats?.total_contributors || 0}</span> dedicated contributors globally.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card className="p-6 h-full ring-1 ring-slate-900/5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20">
                        <h3 className="text-lg font-semibold mb-2">Why it matters</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Every €5 weekly contribution compounds into massive change. We pool these resources to fund essential community projects, provide emergency relief, and build lasting infrastructure for those in need.
                        </p>
                        <div className="mt-8 pt-6 border-t border-indigo-400/30">
                            <p className="text-sm font-medium">Join the movement today.</p>
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                    <Card className="ring-1 ring-slate-900/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-base font-semibold text-slate-900">Recent Champions</h3>
                        </div>
                        {recent.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Be the first champion to contribute!
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {recent.map((c, i) => (
                                    <li key={i} className="px-6 py-5 flex items-center transition-colors hover:bg-slate-50/50">
                                        {c.avatar ? (
                                            <img className="h-12 w-12 rounded-full ring-2 ring-white shadow-sm object-cover mr-4" src={c.avatar} alt={c.name} />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold ring-2 ring-white shadow-sm mr-4">
                                                {(c.name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {c.name || 'Anonymous Hero'}
                                            </p>
                                            <p className="text-sm text-slate-500 truncate">
                                                contributed €{(c.amount / 100).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 whitespace-nowrap text-sm text-slate-400">
                                            {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
