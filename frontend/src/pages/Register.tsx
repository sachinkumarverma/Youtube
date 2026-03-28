import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { supabase } from '../lib/supabase';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username,
                email,
                password
            });

            // Save token and navigate
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    const { email, user_metadata } = session.user;
                    const response = await axios.post(`${API_BASE_URL}/auth/google`, {
                        email,
                        username: user_metadata.name || email?.split('@')[0] || 'User',
                        avatar_url: user_metadata.avatar_url
                    });
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    await supabase.auth.signOut();
                    window.location.href = '/';
                } catch (err) {
                    console.error("Google Auth Sync Failed", err);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleAuth = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
    };

    const token = localStorage.getItem('token');
    if (token) return <Navigate to="/" replace />;

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-primary)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create an Account</h2>

            {error && <div style={{ color: '#ff4444', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,0,0,0.1)', borderRadius: '4px' }}>{error}</div>}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.8rem', background: loading ? '#555' : '#ff0000', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '1rem' }}
                >
                    {loading ? 'Creating...' : 'Register'}
                </button>
            </form>

            <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>OR</div>
            <button
                type="button"
                onClick={handleGoogleAuth}
                style={{ width: '100%', padding: '0.8rem', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                Continue with Google
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#aaa' }}>
                Already have an account? <Link to="/login" style={{ color: '#3ea6ff', textDecoration: 'none' }}>Login</Link>
            </p>
        </div>
    );
};

export default Register;
