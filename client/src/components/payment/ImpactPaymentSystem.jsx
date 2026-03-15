import { useState, useEffect } from "react";
import { 
    PaymentRequestButtonElement, 
    useStripe, 
    useElements,
    PaymentElement 
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "../../lib/api";

export default function ImpactPaymentSystem({ amount = 500, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    
    // States
    const [paymentRequest, setPaymentRequest] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | wallet_ready | processing | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('wallet'); // wallet | card

    useEffect(() => {
        if (!stripe) return;

        const pr = stripe.paymentRequest({
            country: 'US',
            currency: 'eur',
            total: {
                label: 'Global Community Contribution',
                amount: amount,
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
                setStatus('wallet_ready');
                setActiveTab('wallet');
            } else {
                setActiveTab('card');
            }
        });

        // The "Magic" event: When user confirms in Apple/Google Pay sheet
        pr.on('paymentmethod', async (ev) => {
            setIsProcessing(true);
            try {
                // 🛠️ Professional Handshake: Create intent on our server
                const { data: { clientSecret } } = await api.post("/api/payment/session", { amount });

                // 🛠️ Confirm with the wallet's payment method
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false }
                );

                if (confirmError) {
                    ev.complete('fail');
                    setErrorMessage(confirmError.message);
                    setStatus('error');
                } else {
                    ev.complete('success');
                    // Finalize in our DB
                    await api.post("/api/payment/finalize", { payment_intent_id: paymentIntent.id });
                    setStatus('success');
                    if (onSuccess) setTimeout(onSuccess, 1500);
                }
            } catch (err) {
                ev.complete('fail');
                setErrorMessage("Infrastructure connection failed.");
                setStatus('error');
            } finally {
                setIsProcessing(false);
            }
        });
    }, [stripe, amount]);

    const handleCardSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setStatus('processing');

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/completion`,
            },
            redirect: 'if_required' 
        });

        if (error) {
            setErrorMessage(error.message);
            setStatus('error');
        } else if (paymentIntent.status === 'succeeded') {
            await api.post("/api/payment/finalize", { payment_intent_id: paymentIntent.id });
            setStatus('success');
            if (onSuccess) setTimeout(onSuccess, 1500);
        }
        setIsProcessing(false);
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden font-sans">
            {/* 1. System Header */}
            <div className="bg-slate-950 p-10 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            Impact v2.4 Active
                        </div>
                        <Shield size={20} className="text-indigo-400" />
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter mb-1 italic">
                        €{(amount / 100).toFixed(2)}
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Community Fuel Contribution</p>
                </div>
            </div>

            {/* 2. Interactive Section */}
            <div className="p-8 md:p-12">
                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center py-10 text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6 shadow-xl shadow-emerald-100">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Impact Verified</h3>
                            <p className="text-slate-500 font-medium">Your contribution has been successfully hashed and recorded.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-8">
                            {/* Tab Switcher (Only if GPay detected) */}
                            {paymentRequest && (
                                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                    <button 
                                        onClick={() => setActiveTab('wallet')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'wallet' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Zap size={14} /> Wallet
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('card')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'card' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <CreditCard size={14} /> Card
                                    </button>
                                </div>
                            )}

                            {activeTab === 'wallet' && paymentRequest ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="p-1.5 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
                                        <PaymentRequestButtonElement 
                                            options={{ 
                                                paymentRequest,
                                                style: {
                                                    paymentRequestButton: {
                                                        type: 'donate',
                                                        theme: 'dark',
                                                        height: '64px',
                                                    },
                                                }
                                            }} 
                                        />
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                            The native Apple/Google Pay sheet will appear. Secure confirmation via biometric hardware.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.form 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    onSubmit={handleCardSubmit}
                                    className="space-y-8"
                                >
                                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 border-dashed">
                                        <PaymentElement options={{ layout: 'tabs' }} />
                                    </div>
                                    
                                    <button
                                        disabled={isProcessing}
                                        className="w-full bg-indigo-600 text-white rounded-[1.2rem] py-5 text-lg font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>Verify & Contribute <ChevronRight size={20} /></>
                                        )}
                                    </button>
                                </motion.form>
                            )}

                            {status === 'error' && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase text-center tracking-widest animate-shake">
                                    <AlertCircle size={14} className="inline mr-2" />
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. System Footer */}
            <div className="bg-slate-50 p-6 flex justify-center items-center gap-6 opacity-30 grayscale pointer-events-none border-t border-slate-100">
                <div className="h-6 w-12 bg-slate-900 rounded-md"></div>
                <div className="h-6 w-12 bg-slate-900 rounded-md"></div>
                <div className="h-6 w-12 bg-slate-900 rounded-md"></div>
            </div>
        </div>
    );
}
