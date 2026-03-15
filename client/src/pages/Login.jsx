import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
    const { login, loginWithEmail, registerWithEmail, verify, resendCode } = useAuth();
    const navigate = useNavigate();
    
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        const success = await login(credentialResponse.credential);
        if (success) {
            navigate('/dashboard');
        } else {
            setError("Google securely declined the request. Please try again.");
            setIsLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let result;
            if (isLoginMode) {
                result = await loginWithEmail(email, password);
            } else {
                if (!name) {
                    setError("Full name is required to personalize your experience.");
                    setIsLoading(false);
                    return;
                }
                result = await registerWithEmail(name, email, password);
            }

            if (result.success) {
                navigate('/dashboard');
            } else if (result.unverified) {
                setIsVerifying(true);
                setEmail(result.email);
                setMessage("Security Verification Required");
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Connectivity issue detected. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await verify(email, verificationCode);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Verification failed. Please check your network.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        setError('');
        const result = await resendCode(email);
        if (result.success) {
            setMessage(result.message);
            setResendCooldown(60);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] mesh-gradient py-12 px-4 relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none delay-1000 animate-pulse"></div>

            <main className="w-full max-w-lg relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-card p-10 glass shadow-2xl overflow-hidden border border-white/40 backdrop-blur-3xl"
                >
                    {/* Header Section */}
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={isVerifying ? 'verify' : isLoginMode ? 'login' : 'register'}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="text-center mb-10"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl text-white mb-6 floating-animation">
                                {isVerifying ? <ShieldCheck size={32} /> : <Lock size={32} />}
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                                {isVerifying ? "Secure Access" : (isLoginMode ? "Welcome Back" : "Join the Movement")}
                            </h2>
                            <p className="text-slate-500 font-medium px-4">
                                {isVerifying ? `Verification code dispatched to ${email}` : 
                                (isLoginMode ? "Sign in to access your dashboard" : "Join over 10M contributors worldwide")}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Feedback */}
                    <AnimatePresence>
                        {message && !error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-6 rounded-xl bg-indigo-50/80 p-4 text-xs font-bold text-indigo-700 border border-indigo-100 flex items-center gap-3"
                            >
                                <span className="shimmer w-2 h-2 rounded-full bg-indigo-400"></span>
                                {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-6 rounded-xl bg-red-50/80 p-4 text-xs font-bold text-red-600 border border-red-100 flex items-start gap-3"
                            >
                                <Shield className="shrink-0 w-4 h-4 mt-0.5" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isVerifying ? (
                        <motion.form 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onSubmit={handleVerifySubmit} 
                            className="space-y-8"
                        >
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative w-full">
                                    <input 
                                        type="text" 
                                        required 
                                        maxLength={6}
                                        autoFocus
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full text-center tracking-[0.5em] font-black text-4xl rounded-3xl border-slate-200 focus:ring-8 focus:ring-indigo-50 px-4 py-8 border-2 outline-none transition-all shadow-xl bg-white"
                                        placeholder="000000"
                                    />
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-sm font-bold text-slate-400">Missing code?</p>
                                    <button 
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={resendCooldown > 0 || isLoading}
                                        className={`text-sm font-black transition-all ${resendCooldown > 0 ? 'text-slate-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                                    >
                                        {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend Now"}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit"
                                className="w-full !rounded-[2rem] !py-6 text-xl font-black shadow-2xl transition-all active:scale-[0.98]" 
                                disabled={isLoading || verificationCode.length !== 6}
                            >
                                {isLoading ? <Spinner className="w-6 h-6" /> : "Verify Identity"}
                            </Button>

                            <div className="text-center">
                                <button 
                                    type="button"
                                    onClick={() => setIsVerifying(false)}
                                    className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                >
                                    Cancel & Restart
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {!isLoginMode && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="relative group"
                                        >
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                            <input 
                                                type="text" 
                                                required={!isLoginMode}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 border-2 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                                placeholder="Global Identity Name"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input 
                                        type="email" 
                                        required 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 border-2 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                        placeholder="Business Email Address"
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input 
                                        type="password" 
                                        required 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 border-2 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                        placeholder="Secure Access Key"
                                    />
                                </div>

                                <Button 
                                    type="submit"
                                    className="w-full !rounded-2xl !py-5 text-lg font-black shadow-xl" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Spinner className="w-6 h-6" /> : (isLoginMode ? "Authorize" : "Create Account")}
                                </Button>
                            </form>

                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-100"></div>
                                <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest leading-none">Social Link</span>
                                <div className="h-px flex-1 bg-slate-100"></div>
                            </div>

                            <div className="flex justify-center p-1 bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Bridge failed.')}
                                    theme="outline"
                                    size="large"
                                    shape="pill"
                                    text="continue_with"
                                    width="100%"
                                />
                            </div>

                            <div className="text-center">
                                <button 
                                    type="button"
                                    onClick={() => setIsLoginMode(!isLoginMode)}
                                    className="text-slate-500 hover:text-indigo-600 font-bold text-sm transition-all"
                                >
                                    {isLoginMode ? "New here? Establish Access" : "Existing Node? Sign In"}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                            <Shield size={12} className="text-indigo-300" />
                            Industry Standard Encryption Active
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
