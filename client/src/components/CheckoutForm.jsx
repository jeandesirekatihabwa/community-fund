import { PaymentElement, ExpressCheckoutElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { Spinner } from "./ui";

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/completion`,
            },
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message);
            } else {
                setMessage("An unexpected error occurred. Please try again.");
            }
        }

        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="w-full">
            <div className="mb-6">
                {/* Express Checkout for Google Pay / Apple Pay */}
                <ExpressCheckoutElement 
                    onConfirm={() => {
                        // Optional handling when express checkout is clicked
                    }}
                    options={{
                        buttonHeight: 45,
                        buttonType: {
                            applePay: 'donate',
                            googlePay: 'donate',
                        }
                    }}
                />

                <div className="relative my-6 flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="shrink-0 px-4 text-sm text-slate-400">or pay with card</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Standard Payment Element (Cards, etc) */}
                <PaymentElement id="payment-element" />
            </div>
            
            <button
                disabled={isProcessing || !stripe || !elements}
                id="submit"
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
                {isProcessing ? (
                    <>
                        <Spinner className="w-5 h-5 text-current" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <span>Confirm Payment</span>
                )}
            </button>
            
            {message && (
                <div id="payment-message" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-inset ring-red-500/10 text-center">
                    {message}
                </div>
            )}
        </form>
    );
}
