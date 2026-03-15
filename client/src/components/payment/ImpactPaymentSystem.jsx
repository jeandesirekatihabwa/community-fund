import { useState, useEffect } from "react";
import { 
    useStripe, 
    useElements,
    PaymentElement 
} from "@stripe/react-stripe-js";
import GooglePayButton from "@google-pay/button-react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Loader2, Globe } from "lucide-react";
import api from "../../lib/api";

export default function ImpactPaymentSystem({ amount = 500, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    
    // States
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('ready'); // ready | success | error | in_app
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('wallet');
    const [publishableKey, setPublishableKey] = useState("");

    useEffect(() => {
        // Fetch the key for Google Pay integration
        api.get("/config").then(({ data }) => {
            setPublishableKey(data.publishableKey);
        });

        // Detection for in-app browser warning
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isInApp = /Instagram|FBAN|FBAV|LinkedInApp|Linktree/i.test(userAgent);
        if (isInApp) setStatus('in_app');
    }, []);

    const handleGooglePaySuccess = async (paymentData) => {
        setIsProcessing(true);
        try {
            // 1. Create a PaymentIntent on the server
            const { data: { clientSecret } } = await api.post("/api/payment/session", { amount });

            // 2. Confirm the payment with Stripe using the token from Google Pay
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: {
                        token: JSON.parse(paymentData.paymentMethodData.tokenizationData.token).id
                    }
                }
            });

            if (error) {
                setErrorMessage(error.message);
                setStatus('error');
            } else if (paymentIntent.status === 'succeeded') {
                await api.post("/api/payment/finalize", { payment_intent_id: paymentIntent.id });
                setStatus('success');
                if (onSuccess) setTimeout(onSuccess, 2000);
            }
        } catch (err) {
            setErrorMessage("Financial verification failed. Please try again.");
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

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
            setStatus('error');
        } else if (paymentIntent.status === 'succeeded') {
            await api.post("/api/payment/finalize", { payment_intent_id: paymentIntent.id });
            setStatus('success');
            if (onSuccess) setTimeout(onSuccess, 2000);
        }
        setIsProcessing(false);
    };

    return (
        <div className="w-full flex flex-col gap-6 font-sans">
            <AnimatePresence mode="wait">
                {status === 'success' ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-10 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6 shadow-2xl shadow-emerald-100">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 italic">Impact Recorded</h3>
                        <p className="text-slate-500 font-medium">Thank you for your contribution!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Tab Controller */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setActiveTab('wallet')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'wallet' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Globe size={14} /> Google Pay
                            </button>
                            <button 
                                onClick={() => setActiveTab('card')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'card' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <CreditCard size={14} /> Other Cards
                            </button>
                        </div>

                        {activeTab === 'wallet' ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="w-full min-h-[64px] flex justify-center">
                                    {publishableKey && (
                                        <GooglePayButton
                                            environment="PRODUCTION"
                                            buttonColor="black"
                                            buttonType="checkout"
                                            buttonSizeMode="fill"
                                            style={{ width: '100%', height: '64px' }}
                                            paymentRequest={{
                                                apiVersion: 2,
                                                apiVersionMinor: 0,
                                                allowedPaymentMethods: [
                                                    {
                                                        type: 'CARD',
                                                        parameters: {
                                                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                            allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
                                                        },
                                                        tokenizationData: {
                                                            type: 'PAYMENT_GATEWAY',
                                                            parameters: {
                                                                gateway: 'stripe',
                                                                'stripe:version': '2018-10-31',
                                                                'stripe:publishableKey': publishableKey,
                                                            },
                                                        },
                                                    },
                                                ],
                                                merchantInfo: {
                                                    merchantId: 'BCR2DN6T6X6X6X6X', // Replace with your real Merchant ID if needed
                                                    merchantName: 'Community Fund',
                                                },
                                                transactionInfo: {
                                                    totalPriceStatus: 'FINAL',
                                                    totalPriceLabel: 'Total',
                                                    totalPrice: (amount / 100).toFixed(2),
                                                    currencyCode: 'EUR',
                                                    countryCode: 'FR',
                                                },
                                            }}
                                            onLoadPaymentData={handleGooglePaySuccess}
                                            onError={(error) => {
                                                console.error("GPay Error:", error);
                                                setErrorMessage("Google Pay initialization failed.");
                                                setStatus('error');
                                            }}
                                        />
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                    Works on all browsers. Professional biometric security.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.form 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onSubmit={handleCardSubmit}
                                className="space-y-6"
                            >
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <PaymentElement options={{ layout: 'tabs' }} />
                                </div>
                                
                                <button
                                    disabled={isProcessing}
                                    className="w-full bg-slate-900 text-white rounded-2xl py-5 text-lg font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>Confirm Payment <ChevronRight size={22} /></>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {status === 'in_app' && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                                <AlertCircle size={14} className="mx-auto mb-2" />
                                You are in an In-App browser. <br />
                                For the best experience, open in Chrome or Safari.
                            </div>
                        )}

                        {status === 'error' && (
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
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">SSL 256-Bit Encryption</p>
                </div>
            </div>
        </div>
    );
}
