import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Calendar, Video, Users as UsersIcon } from 'lucide-react';
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
}

export default function Users() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="animate-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
                        <UsersIcon size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>User Management</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>View and manage all registered platform users</p>
                    </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
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
                                    <th>ID</th>
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
                                        <td style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {user.id}
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
