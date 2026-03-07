import { Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import Completion from "./pages/Completion";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import api from "./lib/api";

function App() {
    const [stripePromise, setStripePromise] = useState(null);

    // Load Stripe globally for Completion route (it needs useStripe)
    useEffect(() => {
        api.get("/config")
            .then(({ data }) => setStripePromise(loadStripe(data.publishableKey)))
            .catch(err => console.error("Could not load Stripe promise globally", err));
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            <Navbar />
            <div className="flex-grow flex flex-col items-stretch">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/completion" element={
                        <Elements stripe={stripePromise}>
                            <Completion />
                        </Elements>
                    } />
                </Routes>
            </div>
        </div>
    );
}

export default App;
