import { useEffect, useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Link } from "react-router-dom";
import { Spinner, Card } from "../components/ui";

import api from "../lib/api";

export default function Completion() {
    const stripe = useStripe();
    const [message, setMessage] = useState("We are verifying your payment status...");
    const [status, setStatus] = useState("processing");

    useEffect(() => {
        if (!stripe) return;

        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) return;

        stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => {
            switch (paymentIntent.status) {
                case "succeeded":
                    try {
                        // Local fallback: tell the server the payment succeeded
                        await api.post('/verify-payment', {
                            payment_intent_id: paymentIntent.id
                        });
                        setMessage("Your €5 contribution was successful!");
                        setStatus("success");
                    } catch (err) {
                        console.error('Local sync failed', err);
                        setMessage("Payment succeeded, but we had trouble updating your dashboard.");
                        setStatus("success");
                    }
                    break;
                case "processing":
                    setMessage("Your payment is processing.");
                    setStatus("processing");
                    break;
                case "requires_payment_method":
                    setMessage("Your payment was not successful, please try again.");
                    setStatus("failed");
                    break;
                default:
                    setMessage("Something went wrong.");
                    setStatus("failed");
                    break;
            }
        });
    }, [stripe]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-slate-50 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
            
            <Card className="w-full max-w-md p-10 text-center animate-in zoom-in-95 duration-500 shadow-xl ring-1 ring-slate-900/5 !rounded-2xl">
                {status === "processing" && (
                    <div className="flex flex-col items-center">
                        <Spinner className="w-12 h-12 text-indigo-500 mb-6" />
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Processing Payment</h1>
                        <p className="mt-2 text-slate-500">{message}</p>
                    </div>
                )}
                
                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100/50 ring-8 ring-green-50 mb-6 shadow-inner shadow-green-500/20">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Thank you!</h1>
                        <p className="text-slate-500 mb-8 max-w-xs">{message}</p>
                        <div className="flex flex-col gap-3 w-full">
                            <Link
                                to="/dashboard"
                                className="group w-full inline-flex justify-center items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                View My Dashboard
                            </Link>
                            <Link
                                to="/community"
                                className="group w-full inline-flex justify-center items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                See Community Impact
                            </Link>
                        </div>
                    </div>
                )}
                
                {status === "failed" && (
                    <div className="flex flex-col items-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100/50 ring-8 ring-red-50 mb-6 shadow-inner shadow-red-500/20">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Payment Failed</h1>
                        <p className="text-slate-500 mb-8">{message}</p>
                        <Link
                            to="/"
                            className="group w-full inline-flex justify-center items-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Try Again
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
