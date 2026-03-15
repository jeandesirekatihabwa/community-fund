import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
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
    const [customAmount, setCustomAmount] = useState(5); // Default to 5
    
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
                setPaymentError("Infrastructure connection delayed.");
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
            const { data } = await api.post("/api/payment/session", {
                amount: customAmount * 100, // Convert to cents
                currency: "eur"
            });
            setClientSecret(data.clientSecret);
            setShowPayment(true);
        } catch (err) {
            console.error("Payment initiation failed", err);
            setPaymentError(err.response?.data?.error || "Financial bridge failed.");
        } finally {
            setIsStartingPayment(false);
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-5rem)] mesh-gradient relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[100px] delay-700 animate-pulse"></div>
            </div>

            <main className="flex-grow flex items-center justify-center py-20 px-4 relative z-10">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    
                    {/* Left: Branding */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-600/10 text-indigo-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2">
                                <Sparkles size={14} className="animate-pulse" />
                                Scalable Financial Impact
                            </span>
                        </div>
                        
                        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1]">
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Community Support</span>
                        </h1>
                        
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                            Building a self-sustaining ecosystem for micro-contributions, trusted by over <span className="text-slate-900 font-extrabold">10 Million</span> heroes globally.
                        </p>

                        <div className="grid grid-cols-3 gap-6 py-4">
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-900">10M+</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Users size={12} className="text-indigo-500" />
                                    Active
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-900">100%</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    Secure
                                </div>
                            </div>
                            <div className="space-y-1 text-center bg-white/50 p-2 rounded-2xl border border-white">
                                <div className="text-2xl font-black text-slate-900 italic">€5</div>
                                <div className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">Fixed Impact</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Payment Experience */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="premium-card p-10 glass shadow-2xl relative overflow-hidden border border-white/50 backdrop-blur-2xl flex flex-col min-h-[500px] justify-center">
                            <AnimatePresence mode="wait">
                                {isInitializing ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center gap-4 py-20"
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
                                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
                                                <div className="flex justify-start mb-8">
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
                                            <div className="flex flex-col items-center space-y-10">
                                                <div className="text-center">
                                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white mb-8 shadow-2xl shadow-indigo-100 hover:rotate-6 transition-transform">
                                                        <Heart size={44} className="fill-white/20" />
                                                    </div>
                                                    <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Initialize Support</h2>
                                                    <p className="text-slate-500 font-medium">Verify your session to reveal 1-tap micro-contribution.</p>
                                                </div>

                                                {paymentError && (
                                                    <div className="w-full rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 flex items-center gap-3">
                                                        <Zap size={14} />
                                                        {paymentError}
                                                    </div>
                                                )}

                                                <div className="w-full space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Select Contribution Amount</p>
                                                    <div className="flex gap-3">
                                                        {[1, 5, 10, 20].map((amt) => (
                                                            <button
                                                                key={amt}
                                                                onClick={() => setCustomAmount(amt)}
                                                                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border ${customAmount === amt ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                                            >
                                                                €{amt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="w-full rounded-[2.5rem] bg-slate-900 p-10 text-center text-white shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="block text-7xl font-black tracking-tighter mb-2 italic">€{customAmount.toFixed(2)}</span>
                                                    <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">Direct Contribution</span>
                                                </div>
                                                
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={initializePayment}
                                                    disabled={isStartingPayment}
                                                    className="group relative flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-indigo-600 px-8 py-6 text-xl font-black text-white shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70"
                                                >
                                                    {isStartingPayment ? (
                                                        <Spinner className="w-6 h-6" />
                                                    ) : (
                                                        <>
                                                            {user ? "Initialize €" + customAmount + " Payment" : "Join & Contribute"}
                                                            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                                                        </>
                                                    )}
                                                </motion.button>

                                                <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck size={14} className="text-indigo-600" />
                                                    Secured by Multi-Factor Biometric Encryption
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
