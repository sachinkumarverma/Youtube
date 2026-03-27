import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Video, MessageSquare, Flag, TrendingUp, Activity, FileText } from 'lucide-react';
import Skeleton from '../components/Skeleton';

const API = 'http://127.0.0.1:5000/api/admin';

interface Stats {
    totalUsers: number;
    totalVideos: number;
    totalComments: number;
    pendingReports: number;
    totalSubscriptions: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API}/stats`),
            axios.get(`${API}/logs?limit=8`)
        ]).then(([sRes, lRes]) => {
            setStats(sRes.data);
            setRecentLogs(lRes.data.logs || []);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', path: '/users' },
        { label: 'Total Videos', value: stats?.totalVideos, icon: Video, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', path: '/videos' },
        { label: 'Comments', value: stats?.totalComments, icon: MessageSquare, color: '#eab308', bg: 'rgba(234,179,8,0.12)', path: '/comments' },
        { label: 'Pending Reports', value: stats?.pendingReports, icon: Flag, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', path: '/reports' },
        { label: 'Platform Activity', value: 'View Logs', icon: Activity, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', path: '/logs' },
    ];

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'var(--danger)';
        if (action.includes('REJECT')) return '#a855f7';
        if (action.includes('FEEDBACK')) return 'var(--info)';
        if (action.includes('REPORT')) return 'var(--warning)';
        return 'var(--text-secondary)';
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Dashboard Overview</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Monitor platform health and user engagement</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Activity size={16} /> Live Data
                </div>
            </div>

            <div className="page-body">
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    {cards.map(c => (
                        <div key={c.label} className="stat-card" onClick={() => navigate(c.path)} style={{ cursor: 'pointer' }}>
                            <div className="stat-icon" style={{ background: c.bg }}>
                                <c.icon size={24} color={c.color} />
                            </div>
                            <div>
                                <div className="stat-value" style={{ fontSize: '22px' }}>
                                    {loading ? <Skeleton width="60px" height="24px" /> : (c.value ?? '—')}
                                </div>
                                <div className="stat-label" style={{ whiteSpace: 'nowrap' }}>{c.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <TrendingUp size={18} color="var(--accent)" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Activity</h3>
                </div>

                {loading ? (
                    <div className="table-container">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '20px' }}>
                                <Skeleton width="100px" height="20px" />
                                <Skeleton width="150px" height="20px" />
                                <Skeleton width="80px" height="20px" />
                                <Skeleton width="120px" height="20px" />
                            </div>
                        ))}
                    </div>
                ) : recentLogs.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No activity yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th>User</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.map(l => (
                                    <tr key={l.id}>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: getActionColor(l.action), background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '6px' }}>
                                                {l.action}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {l.entity_type} / {l.entity_id?.substring(0, 8)}...
                                        </td>
                                        <td style={{ fontSize: '13px' }}>{l.username || '—'}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {new Date(l.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
