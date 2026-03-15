import { useState, useEffect } from "react";
import {
    PaymentRequestButtonElement,
    useStripe,
    useElements,
    PaymentElement
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Loader2, Zap, Smartphone } from "lucide-react";
import api from "../../lib/api";

export default function ImpactPaymentSystem({ amount = 500, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();

    // States
    const [paymentRequest, setPaymentRequest] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('detecting'); // detecting | ready | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('card');
    const [walletType, setWalletType] = useState('Google Pay'); // Default display name

    useEffect(() => {
        if (!stripe) return;

        // 1. Create the Payment Request for Live Environment
        const pr = stripe.paymentRequest({
            country: 'FR',
            currency: 'eur',
            total: {
                label: 'Good Vibes Contribution',
                amount: amount,
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        // 2. Check if the device has a Wallet (G-Pay or Apple Pay)
        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
                setStatus('ready');
                setActiveTab('wallet');

                // Detection for UI labeling
                if (result.applePay) setWalletType('Apple Pay');
                else if (result.googlePay) setWalletType('Google Pay');
                else setWalletType('Mobile Wallet');
            } else {
                setStatus('ready');
                setActiveTab('card');
            }
        });

        // 3. Handle the Native Payment (Fingerprint/FaceID)
        pr.on('paymentmethod', async (ev) => {
            setIsProcessing(true);
            try {
                // Create the real Live session
                const { data: { clientSecret } } = await api.post("/api/payment/session", { amount });

                // Confirm with the biometric data
                const { error, paymentIntent } = await stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false }
                );

                if (error) {
                    ev.complete('fail');
                    setErrorMessage(error.message);
                } else {
                    ev.complete('success');
                    await api.post("/api/payment/finalize", { payment_intent_id: paymentIntent.id });
                    setStatus('success');
                    if (onSuccess) setTimeout(onSuccess, 2000);
                }
            } catch (err) {
                ev.complete('fail');
                setErrorMessage("Infrastructure connection failed.");
            } finally {
                setIsProcessing(false);
            }
        });
    }, [stripe, amount]);

    const handleCardSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/completion`,
            },
            redirect: 'if_required'
        });

        if (error) {
            setErrorMessage(error.message);
        } else if (paymentIntent.status === 'succeeded') {
            await api.post("/api/payment/finalize", { payment_intent_id: paymentIntent.id });
            setStatus('success');
            if (onSuccess) setTimeout(onSuccess, 2000);
        }
        setIsProcessing(false);
    };

    if (status === 'detecting') {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                    Verifying Merchant Security...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6 font-sans">
            <AnimatePresence mode="wait">
                {status === 'success' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-10 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6 shadow-2xl shadow-emerald-100 border border-emerald-100">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 italic tracking-tighter">Solidarity Success</h3>
                        <p className="text-slate-500 font-medium tracking-tight">Your Good Vibes contribution is live.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Professional Tab Switcher */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                            {paymentRequest && (
                                <button
                                    onClick={() => setActiveTab('wallet')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'wallet' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Smartphone size={14} /> {walletType}
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('card')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'card' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <CreditCard size={14} /> Direct Card
                            </button>
                        </div>

                        {activeTab === 'wallet' && paymentRequest ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-1 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden hover:scale-[1.01] transition-transform cursor-pointer">
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
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                                        Secure biometric authentication required.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onSubmit={handleCardSubmit}
                                className="space-y-8"
                            >
                                <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-200 border-dashed">
                                    <PaymentElement options={{ layout: 'tabs' }} />
                                </div>

                                <button
                                    disabled={isProcessing}
                                    className="w-full bg-slate-900 text-white rounded-2xl py-6 text-xl font-black shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>Process Real Contribution <ChevronRight size={22} /></>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {errorMessage && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-2"
                            >
                                <AlertCircle size={14} />
                                {errorMessage}
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-4 mt-4 opacity-50">
                <div className="flex justify-center items-center gap-6 grayscale pointer-events-none">
                    <Shield size={16} className="text-slate-400" />
                    <div className="h-4 w-px bg-slate-200"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Payment Infrastructure</p>
                </div>
            </div>
        </div>
    );
}
