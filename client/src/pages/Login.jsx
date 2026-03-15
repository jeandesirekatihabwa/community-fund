import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Github, Chrome, Shield } from 'lucide-react';

export default function Login() {
    const { login, loginWithEmail, registerWithEmail, verify } = useAuth();
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
            setError("High traffic detected. Please try again in a moment.");
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

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] mesh-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none delay-1000 animate-pulse"></div>

            <main className="w-full max-w-lg relative z-10 auth-transition-container">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="premium-card p-10 glass shadow-2xl overflow-hidden border border-white/40"
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
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-indigo-200 shadow-xl text-white mb-6 floating-animation">
                                {isVerifying ? <ShieldCheck size={32} /> : <Lock size={32} />}
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                                {isVerifying ? "Secure Verification" : (isLoginMode ? "Welcome Back" : "Scale the Community")}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {isVerifying ? "Enter the 6-digit access code sent to your email" : 
                                (isLoginMode ? "Sign in to access your dashboard" : "Join 10M+ contributors worldwide")}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Feedback Messages */}
                    <AnimatePresence>
                        {message && !error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mb-6 rounded-xl bg-indigo-50/80 p-4 text-sm text-indigo-700 border border-indigo-100 flex items-center gap-3"
                            >
                                <span className="shimmer w-2 h-2 rounded-full bg-indigo-400"></span>
                                {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mb-6 rounded-xl bg-red-50/80 p-4 text-sm text-red-600 border border-red-100 flex items-start gap-3"
                            >
                                <Shield className="shrink-0 w-4 h-4 mt-0.5" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isVerifying ? (
                        <motion.form 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleVerifySubmit} 
                            className="space-y-8"
                        >
                            <div className="relative">
                                <input 
                                    type="text" 
                                    required 
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full text-center tracking-[0.8em] font-bold text-3xl rounded-2xl border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 px-6 py-6 border-2 outline-none transition-all shadow-inner bg-slate-50/50"
                                    placeholder="••••••"
                                />
                            </div>
                            <Button 
                                type="submit"
                                className="w-full !rounded-2xl !py-5 text-lg font-bold shadow-2xl shadow-indigo-200 transition-transform active:scale-95 group" 
                                disabled={isLoading}
                            >
                                {isLoading ? <Spinner className="w-6 h-6" /> : (
                                    <>
                                        Verify Identity
                                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                                    </>
                                )}
                            </Button>
                            <div className="text-center">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsVerifying(false);
                                        setError('');
                                        setMessage('');
                                    }}
                                    className="text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    Didn't get a code? Go back and try again
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={handleManualSubmit} className="space-y-5">
                                <AnimatePresence mode="popLayout">
                                    {!isLoginMode && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                                <input 
                                                    type="text" 
                                                    required={!isLoginMode}
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 border-2 focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none"
                                                    placeholder="Global Identity (Name)"
                                                />
                                            </div>
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
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 border-2 focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none"
                                        placeholder="Secure Business Email"
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input 
                                        type="password" 
                                        required 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 border-2 focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none"
                                        placeholder="Master Encryption Key"
                                    />
                                </div>

                                <Button 
                                    type="submit"
                                    className="w-full !rounded-2xl !py-5 text-lg font-bold shadow-2xl shadow-indigo-100 transition-all hover:shadow-indigo-200 active:scale-95" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Spinner className="w-6 h-6" /> : (isLoginMode ? "Secure Authorization" : "Provision New Account")}
                                </Button>
                            </form>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-slate-200"></div>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Global Auth Bridge</span>
                                <div className="h-px flex-1 bg-slate-200"></div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex justify-center p-1 bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 shadow-sm transition-all overflow-hidden relative">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google secure bridge failed.')}
                                        useOneTap={false}
                                        theme="outline"
                                        size="large"
                                        shape="pill"
                                        text="continue_with"
                                        width="100%"
                                    />
                                </div>
                            </div>

                            <div className="text-center">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsLoginMode(!isLoginMode);
                                        setError('');
                                        setMessage('');
                                    }}
                                    className="text-slate-600 hover:text-indigo-600 font-bold transition-all text-sm decoration-indigo-200 decoration-2 underline-offset-4 hover:underline"
                                >
                                    {isLoginMode ? "New here? Create global identity" : "Existing verified user? Sign in"}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <Shield size={12} className="text-indigo-400" />
                            Industry Standard 256-bit Encryption
                        </div>
                        <p className="px-6 text-center text-[10px] text-slate-400 leading-relaxed font-semibold">
                            By authenticating, you acknowledge our commitment to global security standards, 
                            <span className="text-slate-600 px-1 hover:text-indigo-600 cursor-pointer">Terms of Operation</span> and 
                            <span className="text-slate-600 px-1 hover:text-indigo-600 cursor-pointer">Data Privacy Governance</span>.
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* Scale Footer Hint */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 text-slate-400 flex items-center gap-3 font-bold text-xs"
            >
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className={`w-6 h-6 rounded-full border-2 border-white bg-slate-${200 + i*100} shimmer`}></div>
                    ))}
                </div>
                Trusted by 10M+ community members
            </motion.div>
        </div>
    );
}
