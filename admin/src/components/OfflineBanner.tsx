import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [reconnecting, setReconnecting] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setReconnecting(true);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        };
        const handleOffline = () => {
            setIsOffline(true);
            setReconnecting(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline && !reconnecting) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000000,
            background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: reconnecting ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                display: 'grid', placeItems: 'center', marginBottom: '24px',
                transition: 'background 0.3s ease'
            }}>
                {reconnecting ? (
                    <Wifi size={64} color="#22c55e" />
                ) : (
                    <WifiOff size={64} color="#ef4444" />
                )}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>
                {reconnecting ? 'Back Online!' : 'No Internet Connection'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px', marginBottom: '32px' }}>
                {reconnecting
                    ? 'Reconnecting and refreshing your data...'
                    : 'It looks like you\'re offline. Please check your network to continue using the admin panel.'
                }
            </p>
            {reconnecting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '16px', fontWeight: 'bold' }}>
                    <RefreshCw size={20} className="spin" /> Loading...
                </div>
            ) : (
                <button onClick={() => window.location.reload()} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px',
                    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '32px',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.2s',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                }}>
                    <RefreshCw size={20} /> Try Again
                </button>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
