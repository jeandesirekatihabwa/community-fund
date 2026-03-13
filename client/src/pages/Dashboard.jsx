import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Card } from '../components/ui';
import api from '../lib/api';

export default function Dashboard() {
    const { user } = useAuth();

    const { data: contributions = [], isLoading, error } = useQuery({
        queryKey: ['myContributions', user?.id],
        queryFn: async () => {
            const res = await api.get('/my-contributions');
            return res.data;
        },
        enabled: !!user, // only fetch if a user exists
    });

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
                <Spinner className="w-8 h-8 text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-inset ring-red-500/10">
                    {error instanceof Error ? error.message : "Unable to load your contributions at this time."}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Impact</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Track the progress of your weekly contributions to the community.
                </p>
            </div>

            <Card className="ring-1 ring-slate-900/5 shadow-sm">
                {contributions.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No contributions yet</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Get started by making your first weekly contribution on the home page.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {contributions.map((contribution) => (
                            <li key={contribution.id} className="p-6 transition-colors hover:bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center ring-1 ring-green-500/10">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-slate-900">
                                                €{(contribution.amount / 100).toFixed(2)}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {new Date(contribution.created_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', month: 'long', day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            contribution.status === 'succeeded' 
                                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                            : 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
                                        }`}>
                                            {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {contribution.payment_intent_id.substring(0, 14)}...
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
