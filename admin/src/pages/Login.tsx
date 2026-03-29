import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogIn, Sun, Moon } from 'lucide-react';
import { API_BASE_URL } from '../constants';

const API = `${API_BASE_URL}/auth`;

export default function Login() {
    const [theme, setTheme] = useState(localStorage.getItem('admin_theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin_theme', theme);
    }, [theme]);
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = isRegister ? `${API}/register` : `${API}/login`;
            const body = isRegister
                ? { username, email, password, secretKey }
                : { email, password };

            const res = await axios.post(endpoint, body);
            localStorage.setItem('admin_token', res.data.token);
            localStorage.setItem('admin_user', JSON.stringify(res.data.user));
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="theme-toggle-btn" style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="auth-card animate-in">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <img src="/logo.png" alt="ViewTube Logo" style={{ width: '80px', height: 'auto', objectFit: 'contain' }} />
                </div>
                <h1>{isRegister ? 'Create Admin Account' : 'Admin Portal'}</h1>
                <p>{isRegister ? 'Register with your admin secret key' : 'Sign in to manage your platform'}</p>

                {error && <div className="error-msg" style={{ marginBottom: '16px' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input className="input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin_username" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Admin Secret Key</label>
                                <input className="input" type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="••••••••" required />
                            </div>
                        </>
                    )}
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@viewtube.com" required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <LogIn size={18} /> {isRegister ? 'Create Account' : 'Sign In'}
                            </span>
                        )}
                    </button>
                </form>

                {!isRegister && (
                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                        <a href="/forgot-password" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Forgot Password?</a>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-main)', fontWeight: 600 }}
                    >
                        {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}
