import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Card } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, User, ArrowRight, Shield, ChevronLeft, Github } from 'lucide-react';

export default function Login() {
    const { initiateAuth, verify, onboard, login, resendCode } = useAuth();
    const navigate = useNavigate();
    
    // Steps: 'identify' -> 'verify' -> 'onboard'
    const [step, setStep] = useState('identify');
    const [email, setEmail] = useState('');
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

    // Action 1: Start identity discovery
    const handleIdentify = async (e) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        setError('');
        
        const result = await initiateAuth(email);
        if (result.success) {
            setStep('verify');
            setMessage(result.message);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    // Action 2: Verify security code
    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (verificationCode.length !== 6) return;
        
        setIsLoading(true);
        setError('');
        
        const result = await verify(email, verificationCode);
        if (result.success) {
            if (result.isNewUser) {
                setStep('onboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    // Action 3: Finalize profile
    const handleOnboard = async (e) => {
        e.preventDefault();
        if (!name) return;
        
        setIsLoading(true);
        setError('');
        
        const result = await onboard(name);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        const result = await login(credentialResponse.credential);
        if (result.success) {
            if (result.isNewUser) {
                setStep('onboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.error);
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        const result = await resendCode(email);
        if (result.success) {
            setMessage(result.message);
            setResendCooldown(60);
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-5rem)] mesh-gradient py-8 px-6 relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none delay-1000 animate-pulse"></div>

            <main className="w-full max-w-lg relative z-10">
                <Card className="p-0 glass shadow-[0_32px_128px_-16px_rgba(0,0,0,0.12)] border-white/40 overflow-hidden">
                    {/* Header Progress indicator */}
                    <div className="flex h-1.5 w-full bg-slate-100/50">
                        <motion.div 
                            animate={{ width: step === 'identify' ? '33.3%' : step === 'verify' ? '66.6%' : '100dvh' }}
                            className="h-full bg-emerald-600 transition-all duration-700"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Title Animation */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    {step !== 'identify' && (
                                        <button 
                                            onClick={() => setStep(step === 'verify' ? 'identify' : 'verify')}
                                            className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                    )}
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-100 flex items-center justify-center text-white">
                                        {step === 'identify' && <Mail size={24} />}
                                        {step === 'verify' && <ShieldCheck size={24} />}
                                        {step === 'onboard' && <User size={24} />}
                                    </div>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                                    {step === 'identify' && "Enter your Email"}
                                    {step === 'verify' && "Check your Email"}
                                    {step === 'onboard' && "Create your Profile"}
                                </h1>
                                <p className="text-slate-500 font-medium mt-2">
                                    {step === 'identify' && "Join the Burundian community in Ireland."}
                                    {step === 'verify' && `We've sent a 6-digit code to ${email}`}
                                    {step === 'onboard' && "Success! Tell us your name for the community."}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Error/Message Display */}
                        <AnimatePresence>
                            {(error || message) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className={`mb-8 p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 ${
                                        error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    }`}
                                >
                                    <Shield className="shrink-0 w-4 h-4 mt-0.5" />
                                    {error || message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* STEP 1: IDENTIFY */}
                        {step === 'identify' && (
                            <motion.form 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onSubmit={handleIdentify} 
                                className="space-y-6"
                            >
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={20} />
                                    <input 
                                        type="email" 
                                        required 
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-slate-100 border-2 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-8 focus:ring-emerald-50 outline-none transition-all text-lg font-bold"
                                        placeholder="name@example.com"
                                    />
                                </div>
                                
                                <Button type="submit" isLoading={isLoading} className="w-full !rounded-[1.5rem] !py-6 text-xl">
                                    Continue <ArrowRight size={20} className="ml-2" />
                                </Button>

                                <div className="relative flex items-center gap-4 py-4">
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Fast Pass</span>
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </div>

                                <div className="flex justify-center p-1.5 bg-white border-2 border-slate-50 rounded-[1.5rem] hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google secure bridge failed')}
                                        shape="pill"
                                        width="100dvh"
                                        text="continue_with"
                                    />
                                </div>
                            </motion.form>
                        )}

                        {/* STEP 2: VERIFY */}
                        {step === 'verify' && (
                            <motion.form 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onSubmit={handleVerify}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <input 
                                        type="text" 
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                        value={verificationCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setVerificationCode(val);
                                            if (val.length === 6) {
                                                // Trigger auto-verify delay
                                                setTimeout(() => handleVerify(), 300);
                                            }
                                        }}
                                        className="w-full text-center tracking-[0.5em] font-black text-5xl rounded-[2rem] border-slate-100 border-2 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50 py-8 outline-none transition-all"
                                    />
                                    
                                    <div className="flex items-center justify-center gap-2">
                                        <p className="text-sm font-bold text-slate-400">Didn't get it?</p>
                                        <button 
                                            type="button"
                                            onClick={handleResend}
                                            disabled={resendCooldown > 0}
                                            className={`text-sm font-black transition-all ${resendCooldown > 0 ? 'text-slate-200' : 'text-indigo-600 hover:scale-105'}`}
                                        >
                                            {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend code"}
                                        </button>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    isLoading={isLoading} 
                                    disabled={verificationCode.length !== 6}
                                    className="w-full !rounded-[1.5rem] !py-6 text-xl"
                                >
                                    Verify Code
                                </Button>
                            </motion.form>
                        )}

                        {/* STEP 3: ONBOARD */}
                        {step === 'onboard' && (
                            <motion.form 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onSubmit={handleOnboard}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input 
                                            type="text" 
                                            required 
                                            autoFocus
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-slate-100 border-2 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-8 focus:ring-indigo-50 outline-none transition-all text-lg font-bold"
                                            placeholder="Your Display Name"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium text-center px-4">
                                        By continuing, you agree to our terms of service and contribution guidelines.
                                    </p>
                                </div>

                                <Button type="submit" isLoading={isLoading} className="w-full !rounded-[1.5rem] !py-6 text-xl shadow-2xl shadow-indigo-200 ring-offset-4 ring-indigo-500">
                                    Start my Journey
                                </Button>
                            </motion.form>
                        )}
                    </div>

                    <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <Shield size={12} className="text-indigo-300" />
                            Multi-Factor Security Shield Active
                        </div>
                    </div>
                </Card>

                {/* Footer simple navigation or links */}
                <div className="mt-12 text-center text-slate-400 text-sm font-medium">
                    <p>© 2026 Good Vibes Solidarity</p>
                    <div className="flex justify-center gap-6 mt-4">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
