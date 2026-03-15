import { useState, useEffect } from "react";
import { PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Spinner } from "./ui";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap } from "lucide-react";

export default function ProfessionalGooglePay({ amount = 500, currency = "eur" }) {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentRequest, setPaymentRequest] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!stripe || !elements) return;

        const pr = stripe.paymentRequest({
            country: 'US',
            currency: currency.toLowerCase(),
            total: {
                label: 'Community Support Contribution',
                amount: amount,
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        // Check the availability of the Payment Request API (Google Pay/Apple Pay)
        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
            } else {
                console.warn("Google Pay/Wallet not available on this device/browser.");
            }
        });

        pr.on('paymentmethod', async (ev) => {
            setIsProcessing(true);
            try {
                // 1. Create PaymentIntent on server
                const { data: { clientSecret } } = await api.post("/create-payment-intent", {
                    amount,
                    currency,
                });

                // 2. Confirm the PaymentIntent with the payment method from Google Pay
                const { error: confirmError } = await stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false }
                );

                if (confirmError) {
                    ev.complete('fail');
                    setError(confirmError.message);
                } else {
                    ev.complete('success');
                    // Success! Redirect to completion
                    window.location.href = `/completion?payment_intent_client_secret=${clientSecret}&redirect_status=succeeded`;
                }
            } catch (err) {
                ev.complete('fail');
                setError("Financial bridge connection failed.");
            } finally {
                setIsProcessing(false);
            }
        });
    }, [stripe, elements, amount, currency]);

    return (
        <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* High-End Price Card */}
            <div className="w-full bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/10 opacity-50"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300">
                            Verified Impact Infrastructure
                        </div>
                    </div>
                    <h3 className="text-7xl font-black tracking-tighter mb-2 italic">
                        €{ (amount / 100).toFixed(2) }
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Weekly Community Fuel</p>
                </div>
            </div>

            {/* The Professional Wallet Button */}
            <div className="px-2">
                <AnimatePresence mode="wait">
                    {paymentRequest ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[1.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-white rounded-[1.4rem] overflow-hidden">
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
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 opacity-40">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck size={12} className="text-indigo-400" />
                                    Native Device Security Handshake
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 text-center space-y-3"
                        >
                            <Zap size={24} className="mx-auto text-amber-500" />
                            <p className="text-sm font-bold text-amber-900">Chrome Wallet Not Detected</p>
                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                To use the 1-Tap Google Pay experience, please ensure you are in **Chrome** and have a card saved in your Google Account.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {isProcessing && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                    <Spinner className="w-12 h-12 text-indigo-500 mb-4" />
                    <p className="text-xl font-black text-white tracking-widest uppercase animate-pulse">Confirming Impact...</p>
                </div>
            )}

            {error && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase text-center tracking-widest"
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
}
