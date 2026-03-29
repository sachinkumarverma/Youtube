import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Calendar, Video, Users as UsersIcon, ShieldCheck, ShieldOff } from 'lucide-react';
import TableSkeleton from '../components/TableSkeleton';
import Skeleton from '../components/Skeleton';
import { API_BASE_URL } from '../constants';

interface UserData {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
    videos_count: string;
    subscribers_count: string;
    is_active: boolean;
}

export default function Users() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/users`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string) => {
        if (togglingId) return;
        setTogglingId(id);
        try {
            const res = await axios.put(`${API_BASE_URL}/users/${id}/toggle-status`);
            setUsers(users.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
        } catch (err) {
            console.error('Failed to toggle user status', err);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div className="stat-icon hide-mobile-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
                        <UsersIcon size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>User Management</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>View and manage all registered platform users</p>
                    </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', flexShrink: 0, textAlign: 'right' }}>
                    {loading ? <Skeleton width="80px" height="18px" /> : `${users.length} Total Users`}
                </div>
            </div>

            <div className="page-body">
                {loading ? (
                    <TableSkeleton cols={6} rows={8} />
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Videos</th>
                                    <th>Subscribers</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={16} />
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                <Mail size={14} />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                <Calendar size={14} />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <Video size={14} />
                                                {user.videos_count}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--accent)' }}>
                                                {user.subscribers_count}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                background: user.is_active !== false ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                                color: user.is_active !== false ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {user.is_active !== false ? 'Active' : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => toggleStatus(user.id)}
                                                disabled={togglingId === user.id}
                                                className={`btn btn-sm ${user.is_active !== false ? 'btn-danger' : 'btn-primary'}`}
                                                title={user.is_active !== false ? 'Deactivate User' : 'Activate User'}
                                                style={{ opacity: togglingId === user.id ? 0.6 : 1, cursor: togglingId === user.id ? 'not-allowed' : 'pointer' }}
                                            >
                                                {togglingId === user.id ? (
                                                    <span className="spinner" style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                                                ) : (
                                                    user.is_active !== false ? <ShieldOff size={15} /> : <ShieldCheck size={15} />
                                                )}
                                                <span className="hide-mobile" style={{ marginLeft: '6px' }}>
                                                    {togglingId === user.id ? 'Wait...' : (user.is_active !== false ? 'Deactivate' : 'Activate')}
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="empty-state">No users found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
