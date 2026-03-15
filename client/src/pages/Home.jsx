import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, ShieldCheck, Globe, ArrowRight, Zap, Users } from "lucide-react";

export default function Home() {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState("");
    const [isInitializing, setIsInitializing] = useState(true);
    const [paymentError, setPaymentError] = useState(null);
    const [isStartingPayment, setIsStartingPayment] = useState(false);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get("/config");
                if (data.publishableKey) {
                    setStripePromise(loadStripe(data.publishableKey));
                }
            } catch (err) {
                console.error("Failed to load Stripe config", err);
                setPaymentError("Infrastructure connection delayed. Please refresh.");
            } finally {
                setIsInitializing(false);
            }
        };
        fetchConfig();
    }, []);

    const initializePayment = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setIsStartingPayment(true);
        setPaymentError(null);
        try {
            const { data } = await api.post("/create-payment-intent", {
                amount: 500,
                currency: "eur",
                user_id: user.id
            });
            setClientSecret(data.clientSecret);
        } catch (err) {
            console.error("Payment initiation failed", err);
            setPaymentError(err.message || "Financial bridge failed. Please try again.");
        } finally {
            setIsStartingPayment(false);
        }
    };

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#4f46e5',
            colorBackground: '#ffffff',
            colorText: '#0f172a',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '5px',
            borderRadius: '16px',
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-5rem)] mesh-gradient relative overflow-hidden font-sans">
            {/* Background Mesh Orbs */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[100px] delay-700 animate-pulse"></div>
            </div>

            <main className="flex-grow flex items-center justify-center py-20 px-4 relative z-10">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    
                    {/* Hero Text Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-2 group cursor-default">
                            <span className="bg-indigo-600/10 text-indigo-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2 animate-bounce">
                                <Sparkles size={14} />
                                Now Scaling Globally
                            </span>
                        </div>
                        
                        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1]">
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Community Support</span>
                        </h1>
                        
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                            Join over <span className="text-slate-900 font-bold">10 Million</span> visionaries. Our mission is to build a self-sustaining financial ecosystem for Every Community, powered by micro-contributions.
                        </p>

                        <div className="grid grid-cols-3 gap-6 py-4">
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-900">10M+</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Users size={12} className="text-indigo-500" />
                                    Members
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-900">180+</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Globe size={12} className="text-purple-500" />
                                    Countries
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-900">100%</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    Verified
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-${100 + i*100} shimmer`}></div>
                                ))}
                            </div>
                            <p className="text-sm font-bold text-slate-400 italic">"The most transparent platform I've ever used."</p>
                        </div>
                    </motion.div>

                    {/* Interaction Card Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="premium-card p-10 glass shadow-2xl relative overflow-hidden border border-white/50 backdrop-blur-2xl">
                            {/* Decorative Shimmer */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white mb-8 shadow-xl shadow-indigo-200 floating-animation">
                                    <Heart size={40} className="fill-white/20" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Initialize Support</h2>
                                <p className="text-slate-500 font-medium">Single micro-contribution to fuel the impact.</p>
                            </div>

                            <AnimatePresence mode="wait">
                                {isInitializing ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-20 gap-4"
                                    >
                                        <Spinner className="w-12 h-12" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Establishing Secure Link...</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="content"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-8"
                                    >
                                        {paymentError && (
                                            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-bold flex items-center gap-3">
                                                <Zap size={16} />
                                                {paymentError}
                                            </div>
                                        )}

                                        {stripePromise && clientSecret ? (
                                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                                                    <CheckoutForm />
                                                </Elements>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-10 w-full rounded-[2rem] bg-slate-900 p-8 text-center text-white shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="block text-6xl font-black tracking-tighter mb-2">€5.00</span>
                                                    <span className="text-indigo-300 text-xs font-black uppercase tracking-[0.2em]">Weekly Contribution</span>
                                                </div>
                                                
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={initializePayment}
                                                    disabled={isStartingPayment}
                                                    className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-70"
                                                >
                                                    {isStartingPayment ? (
                                                        <Spinner className="w-6 h-6 text-current" />
                                                    ) : (
                                                        <>
                                                            {user ? "Establish Support Link" : "Join & Contribute"}
                                                            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                                                        </>
                                                    )}
                                                </motion.button>
                                                
                                                <div className="mt-8 flex items-center justify-center gap-8 opacity-40">
                                                    <div className="h-6 w-12 bg-slate-400 rounded-md shimmer"></div>
                                                    <div className="h-6 w-12 bg-slate-400 rounded-md shimmer"></div>
                                                    <div className="h-6 w-12 bg-slate-400 rounded-md shimmer"></div>
                                                </div>
                                                
                                                <p className="mt-6 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck size={14} className="text-indigo-600" />
                                                    Securely encrypted by Stripe Infrastructure
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
