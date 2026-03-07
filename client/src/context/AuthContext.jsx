import { createContext, useState, useEffect, useContext } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (e) {
                    console.error("Invalid token", e);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        
        initializeAuth();
    }, []);

    const login = async (credential) => {
        try {
            const res = await api.post('/auth/google', { token: credential });
            const { user, token } = res.data;
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const loginWithEmail = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            const { user, token } = res.data;
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return { success: true };
        } catch (error) {
            console.error("Email login failed", error);
            return { 
                success: false, 
                error: error.response?.data?.error || "Invalid credentails" 
            };
        }
    };

    const registerWithEmail = async (name, email, password) => {
        try {
            const res = await api.post('/auth/register', { name, email, password });
            const { user, token } = res.data;
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return { success: true };
        } catch (error) {
            console.error("Registration failed", error);
            return { 
                success: false, 
                error: error.response?.data?.error || "Registration failed" 
            };
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithEmail, registerWithEmail, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
