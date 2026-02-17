'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = '';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Log for debugging production issues
                console.log('Checking auth with token...');
                const res = await axios.get('/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
                console.log('Auth success:', res.data.username);
            } catch (err) {
                console.error('Auth check failed:', err.response?.status);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.accessToken);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (username, email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
        localStorage.setItem('token', res.data.accessToken);
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshUser = async () => {
        await checkAuth();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
