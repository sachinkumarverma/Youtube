import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Subscriptions() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/user/subscriptions', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSubscriptions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubscriptions();
    }, []);

    const toggleNotifications = async (channelId: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(`http://127.0.0.1:5000/api/user/subscribe/${channelId}/toggle-notifications`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubscriptions(prev => prev.map(sub =>
                sub.channel.id === channelId ? { ...sub, notifications_on: res.data.notifications_on } : sub
            ));
        } catch (err) { console.error(err); }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '32px', fontWeight: 'bold' }}>{t('subscriptions')}</h1>

            {subscriptions.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '18px' }}>{t('noSubscriptions')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {subscriptions.map(sub => (
                        <div key={sub.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }} className="hover-bg">
                            <Link to={`/channel/${sub.channel.id}`} style={{ display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                                    {sub.channel.avatar_url ? (
                                        <img src={sub.channel.avatar_url} alt="Channel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                                            {sub.channel.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {sub.channel.username} <CheckCircle2 size={16} color="var(--text-secondary)" />
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                        @{sub.channel.username.toLowerCase().replace(' ', '')} • {sub.channel._count?.subscribers || 0} {t('subscribers')}
                                    </div>
                                </div>
                            </Link>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => toggleNotifications(sub.channel.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        background: 'var(--bg-hover)',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    {sub.notifications_on ? <Bell size={18} /> : <BellOff size={18} color="var(--text-secondary)" />}
                                    {t('notifications')}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
