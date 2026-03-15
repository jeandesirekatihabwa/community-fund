import { Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import Completion from "./pages/Completion";

import api from "./lib/api";

function App() {
  const [publishableKey, setPublishableKey] = useState("");
  const [stripeConfigLoading, setStripeConfigLoading] = useState(true);

  useEffect(() => {
    const fetchStripeConfig = async () => {
      try {
        const { data } = await api.get("/config");
        setPublishableKey(data.publishableKey || "");
      } catch (error) {
        console.error("Could not load Stripe config:", error);
      } finally {
        setStripeConfigLoading(false);
      }
    };

    fetchStripeConfig();
  }, []);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow flex flex-col pb-32 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/community" element={<Community />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/completion"
            element={
              stripeConfigLoading ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                  <p className="text-sm text-slate-500">Loading payment page...</p>
                </div>
              ) : stripePromise ? (
                <Elements stripe={stripePromise}>
                  <Completion />
                </Elements>
              ) : (
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                  <p className="text-sm text-red-500 text-center">
                    Payment system could not be loaded. Please try again later.
                  </p>
                </div>
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;