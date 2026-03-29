import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mail, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { API_BASE_URL } from '../constants';

type Step = 'email' | 'otp' | 'reset';

const API = `${API_BASE_URL}/auth`;

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API}/forgot-password`, { email });
            setStep('otp');
            setResendTimer(60);
            setSuccess('OTP sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpStr = otp.join('');
        if (otpStr.length !== 6) { setError('Please enter the complete OTP'); return; }
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API}/verify-otp`, { email, otp: otpStr });
            setStep('reset');
            setSuccess('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API}/reset-password`, { email, otp: otp.join(''), password });
            setSuccess('Password reset successfully!');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API}/forgot-password`, { email });
            setOtp(['', '', '', '', '', '']);
            setResendTimer(60);
            setSuccess('New OTP sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-in" style={{ maxWidth: '420px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <img src="/logo.png" alt="ViewTube Logo" style={{ width: '80px', height: 'auto', objectFit: 'contain' }} />
                </div>
                <h1>
                    {step === 'email' && 'Forgot Password'}
                    {step === 'otp' && 'Verify OTP'}
                    {step === 'reset' && 'Reset Password'}
                </h1>
                <p>
                    {step === 'email' && 'Enter your admin email to receive a verification code'}
                    {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
                    {step === 'reset' && 'Create your new password'}
                </p>

                {error && <div className="error-msg" style={{ marginBottom: '16px' }}>{error}</div>}
                {success && <div style={{ color: '#4ade80', marginBottom: '16px', padding: '10px 14px', background: 'rgba(74,222,128,0.1)', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>{success}</div>}

                {step === 'email' && (
                    <form className="auth-form" onSubmit={handleSendOtp}>
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@viewtube.com" required style={{ paddingLeft: '38px' }} />
                            </div>
                        </div>
                        <button className="auth-btn" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form className="auth-form" onSubmit={handleVerifyOtp} style={{ alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    style={{
                                        width: '46px', height: '54px', textAlign: 'center', fontSize: '22px', fontWeight: 'bold',
                                        borderRadius: '10px', border: digit ? '2px solid var(--accent)' : '1px solid var(--border)',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                        <button className="auth-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading} style={{ background: 'transparent', border: 'none', color: resendTimer > 0 ? 'var(--text-secondary)' : 'var(--accent)', cursor: resendTimer > 0 ? 'default' : 'pointer', fontSize: '14px', fontFamily: 'var(--font-main)' }}>
                            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                    </form>
                )}

                {step === 'reset' && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <div className="input-group">
                            <label className="input-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingLeft: '38px' }} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingLeft: '38px' }} />
                            </div>
                        </div>
                        <button className="auth-btn" type="submit" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} /> Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
