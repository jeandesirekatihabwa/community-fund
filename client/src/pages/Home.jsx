import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";
import ImpactPaymentSystem from "../components/payment/ImpactPaymentSystem";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, ShieldCheck, Globe, ArrowRight, Zap, Users, ChevronLeft } from "lucide-react";

export default function Home() {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState("");
    const [isInitializing, setIsInitializing] = useState(true);
    const [paymentError, setPaymentError] = useState(null);
    const [isStartingPayment, setIsStartingPayment] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    
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
            // New endpoint: /api/payment/session
            const { data } = await api.post("/api/payment/session", {
                amount: 500,
                currency: "eur"
            });
            setClientSecret(data.clientSecret);
            setShowPayment(true);
        } catch (err) {
            console.error("Payment initiation failed", err);
            setPaymentError(err.message || "Financial bridge failed. Please try again.");
        } finally {
            setIsStartingPayment(false);
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-5rem)] mesh-gradient relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[100px] delay-700 animate-pulse"></div>
            </div>

            <main className="flex-grow flex items-center justify-center py-20 px-4 relative z-10">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-2 group cursor-default">
                            <span className="bg-indigo-600/10 text-indigo-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2 animate-bounce">
                                <Sparkles size={14} />
                                Scaling Locally & Globally
                            </span>
                        </div>
                        
                        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1]">
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Community Support</span>
                        </h1>
                        
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                            Join over <span className="text-slate-900 font-bold">10 Million</span> visionaries. Our mission is to build a self-sustaining financial ecosystem, powered by micro-contributions.
                        </p>

                        <div className="grid grid-cols-3 gap-6 py-4">
                            {[
                                { count: "10M+", label: "Members", Icon: Users, color: "text-indigo-500" },
                                { count: "180+", label: "Countries", Icon: Globe, color: "text-purple-500" },
                                { count: "100%", label: "Verified", Icon: ShieldCheck, color: "text-emerald-500" }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900">{stat.count}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <stat.Icon size={12} className={stat.color} />
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 shimmer"></div>
                                ))}
                            </div>
                            <p className="text-sm font-bold text-slate-400 italic">"The most professional platform I've used."</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="premium-card p-10 glass shadow-2xl relative overflow-hidden border border-white/50 backdrop-blur-2xl min-h-[500px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {isInitializing ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center gap-4"
                                    >
                                        <Spinner className="w-12 h-12" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Establishing Secure Financial Link...</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="content"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full"
                                    >
                                        {stripePromise && showPayment ? (
                                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full px-4">
                                                <div className="flex justify-start mb-6 -ml-2">
                                                    <button onClick={() => setShowPayment(false)} className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                                        <ChevronLeft size={16} />
                                                        Back to Mission
                                                    </button>
                                                </div>
                                                <Elements stripe={stripePromise} options={{ 
                                                    clientSecret,
                                                    appearance: { theme: 'stripe', variables: { colorPrimary: '#4f46e5' } }
                                                }}>
                                                    <ImpactPaymentSystem 
                                                        amount={500} 
                                                        onSuccess={() => navigate('/dashboard')} 
                                                    />
                                                </Elements>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center space-y-8">
                                                <div className="text-center">
                                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white mb-8 shadow-xl shadow-indigo-200">
                                                        <Heart size={40} className="fill-white/20" />
                                                    </div>
                                                    <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Initialize Support</h2>
                                                    <p className="text-slate-500 font-medium">Fuel the community with a 1-tap micro-contribution.</p>
                                                </div>

                                                {paymentError && (
                                                    <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 flex items-center gap-3">
                                                        <Zap size={14} />
                                                        {paymentError}
                                                    </div>
                                                )}

                                                <div className="w-full rounded-[2rem] bg-slate-900 p-8 text-center text-white shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="block text-6xl font-black tracking-tighter mb-2 italic">€5.00</span>
                                                    <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">Weekly Contribution</span>
                                                </div>
                                                
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={initializePayment}
                                                    disabled={isStartingPayment}
                                                    className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-70"
                                                >
                                                    {isStartingPayment ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <>
                                                            {user ? "Initialize Direct Payment" : "Join & Contribute"}
                                                            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                                                        </>
                                                    )}
                                                </motion.button>
                                                
                                                <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck size={14} className="text-indigo-600" />
                                                    Native Hardware Encryption Verified
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
