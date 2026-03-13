import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner } from '../components/ui';

export default function Login() {
    const { login, loginWithEmail, registerWithEmail } = useAuth();
    const navigate = useNavigate();
    
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSuccess = async (credentialResponse) => {
        const success = await login(credentialResponse.credential);
        if (success) {
            navigate('/dashboard');
        } else {
            setError("Google login encountered an error. Please try again.");
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
                    setError("Name is required for registration.");
                    setIsLoading(false);
                    return;
                }
                result = await registerWithEmail(name, email, password);
            }

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
            
            <main className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 !rounded-2xl">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 mb-6">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {isLoginMode ? "Sign in to your account" : "Create a new account"}
                        </h2>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-500/10 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        {!isLoginMode && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required={!isLoginMode}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-2.5 border outline-none transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-2.5 border outline-none transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-2.5 border outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <Button 
                            type="submit"
                            className="w-full justify-center !rounded-xl !py-3" 
                            disabled={isLoading}
                        >
                            {isLoading ? <Spinner className="w-5 h-5 text-current" /> : (isLoginMode ? "Sign In" : "Create Account")}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button 
                            type="button"
                            onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setError('');
                            }}
                            className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                        >
                            {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>

                    <div className="relative my-6 flex items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="shrink-0 px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">or</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="flex justify-center p-3 bg-slate-50 rounded-xl border border-slate-200/60 shadow-inner">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            useOneTap={false}
                            theme="outline"
                            size="large"
                            shape="rectangular"
                            text="continue_with"
                        />
                    </div>
                    
                    <p className="px-6 text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
                        By continuing, you verify that you agree to our Terms of Service and Privacy Policy.
                    </p>
                </Card>
            </main>
        </div>
    );
}
