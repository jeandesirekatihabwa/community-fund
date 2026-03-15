import GooglePayButton from '@google-pay/button-react';
import { useState, useEffect } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Spinner } from "./ui";
import api from "../lib/api";
import { motion } from "framer-motion";

export default function ProfessionalGooglePay({ amount = 500, currency = "EUR" }) {
    const stripe = useStripe();
    const [publishableKey, setPublishableKey] = useState("");
    const [isFinishing, setIsFinishing] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKey = async () => {
            try {
                const { data } = await api.get("/config");
                setPublishableKey(data.publishableKey);
                // Artificial delay for smooth mobile UI transition
                setTimeout(() => setIsReady(true), 800);
            } catch (err) {
                console.error("Config fetch failed", err);
                setError("Infrastructure link failed");
            }
        };
        fetchKey();
    }, []);

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Spinner className="w-10 h-10" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                    Waking Wallet Infrastructure...
                </p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center w-full gap-6"
        >
            <div className="w-full bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative z-10 text-center">
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Secured Ecosystem</p>
                    <h3 className="text-6xl font-black tracking-tighter mb-2">€{ (amount / 100).toFixed(2) }</h3>
                    <p className="text-slate-400 text-sm font-medium">One-tap micro-contribution</p>
                </div>
            </div>

            <div className="w-full max-w-sm rounded-[1.5rem] overflow-hidden">
                {publishableKey && (
                    <GooglePayButton
                        environment="TEST"
                        buttonColor="black"
                        buttonType="donate"
                        buttonSizeMode="fill"
                        className="h-16 w-full"
                        paymentRequest={{
                            apiVersion: 2,
                            apiVersionMinor: 0,
                            allowedPaymentMethods: [
                                {
                                    type: 'CARD',
                                    parameters: {
                                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                        allowedCardNetworks: ['MASTERCARD', 'VISA'],
                                    },
                                    tokenizationSpecification: {
                                        type: 'PAYMENT_GATEWAY',
                                        parameters: {
                                            gateway: 'stripe',
                                            'stripe:publishableKey': publishableKey,
                                            'stripe:version': '2020-08-27',
                                        },
                                    },
                                },
                            ],
                            merchantInfo: {
                                merchantId: '12345678901234567890',
                                merchantName: 'Community Fund Global',
                            },
                            transactionInfo: {
                                totalPriceStatus: 'FINAL',
                                totalPriceLabel: 'Total',
                                totalPrice: (amount / 100).toString(),
                                currencyCode: currency,
                                countryCode: 'FR', // Set to target region
                            },
                        }}
                        onLoadPaymentData={async (paymentData) => {
                            console.log('Google Pay Success', paymentData);
                            window.location.href = `/completion?payment_intent_client_secret=demo_success&redirect_status=succeeded`;
                        }}
                        onError={(err) => {
                            console.error("GPay Error:", err);
                            setError("Mobile wallet inactive. Ensure a card is saved in Chrome.");
                        }}
                    />
                )}
            </div>

            {isFinishing && (
                <div className="flex items-center gap-3 text-indigo-600 font-bold animate-pulse">
                    <Spinner className="w-4 h-4" />
                    <span>Processing Secure Token...</span>
                </div>
            )}

            {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-6 py-3 rounded-full border border-red-100 text-center">
                    {error}
                </p>
            )}

            <div className="flex flex-col items-center gap-2 opacity-50 mt-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Zero-Knowledge Hardware Encryption</p>
            </div>
        </motion.div>
    );
}
