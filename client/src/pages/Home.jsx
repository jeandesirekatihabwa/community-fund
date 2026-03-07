import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";
import { useAuth } from "../context/AuthContext";
import { Spinner, Card } from "../components/ui";
import api from "../lib/api";

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
                setPaymentError("Could not connect to payment provider. Please try again later.");
            } finally {
                setIsInitializing(false);
            }
        };
        fetchConfig();
    }, []);

    const initializePayment = async () => {
        // Enforce login before contribution
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
            setPaymentError(err.message || "Failed to start payment. Please try again.");
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
            spacingUnit: '4px',
            borderRadius: '8px',
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
            {/* Soft background blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>
            
            <main className="w-full max-w-md relative z-10">
                <Card className="p-8 sm:p-10 !rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                    
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                            Support Community
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Join us in making an impact. Your €5 weekly contribution drives our mission forward.
                        </p>
                    </div>

                    {isInitializing ? (
                        <div className="flex justify-center py-12">
                            <Spinner className="w-8 h-8 text-indigo-500" />
                        </div>
                    ) : (
                        <>
                            {paymentError && (
                                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-inset ring-red-500/10">
                                    {paymentError}
                                </div>
                            )}

                            {stripePromise && clientSecret ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                                        <CheckoutForm />
                                    </Elements>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="mb-8 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-center text-white shadow-lg shadow-indigo-500/30">
                                        <span className="block text-4xl font-bold tracking-tight mb-1">€5.00</span>
                                        <span className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Weekly Contribution</span>
                                    </div>
                                    
                                    <button
                                        onClick={initializePayment}
                                        disabled={isStartingPayment}
                                        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isStartingPayment ? (
                                            <Spinner className="w-5 h-5 text-current" />
                                        ) : (
                                            <>
                                                {user ? "Contribute Now" : "Sign in to Contribute"}
                                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                    <p className="mt-4 text-xs text-center text-slate-400">
                                        Secured by Stripe. Cancel anytime.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </main>
        </div>
    );
}
