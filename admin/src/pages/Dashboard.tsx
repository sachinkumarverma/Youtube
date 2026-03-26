import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Video, MessageSquare, Flag, Heart, TrendingUp, Activity } from 'lucide-react';

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

    useEffect(() => {
        axios.get(`${API}/stats`).then(r => setStats(r.data)).catch(console.error);
        axios.get(`${API}/logs?limit=8`).then(r => setRecentLogs(r.data.logs || [])).catch(console.error);
    }, []);

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
        { label: 'Total Videos', value: stats?.totalVideos, icon: Video, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
        { label: 'Comments', value: stats?.totalComments, icon: MessageSquare, color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
        { label: 'Pending Reports', value: stats?.pendingReports, icon: Flag, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        { label: 'Subscriptions', value: stats?.totalSubscriptions, icon: Heart, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    ];

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'var(--danger)';
        if (action.includes('REJECT')) return '#a855f7';
        if (action.includes('FEEDBACK')) return 'var(--info)';
        if (action.includes('REPORT')) return 'var(--warning)';
        return 'var(--text-secondary)';
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Platform overview and recent activity</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Activity size={16} /> Live
                </div>
            </div>

            <div className="page-body animate-in">
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    {cards.map(c => (
                        <div key={c.label} className="stat-card">
                            <div className="stat-icon" style={{ background: c.bg }}>
                                <c.icon size={24} color={c.color} />
                            </div>
                            <div>
                                <div className="stat-value">{c.value ?? '—'}</div>
                                <div className="stat-label">{c.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <TrendingUp size={18} color="var(--accent)" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Activity</h3>
                </div>

                {recentLogs.length === 0 ? (
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
        </>
    );
}

function FileText(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>;
}
