import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Trash2, Video,AlertTriangle } from 'lucide-react';
import TableSkeleton from '../components/TableSkeleton';
import Skeleton from '../components/Skeleton';
import { API_BASE_URL } from '../constants';

const API = API_BASE_URL;

const formatDuration = (duration: string | number | undefined | null): string => {
    if (!duration) return '0:00';
    const raw = typeof duration === 'number' ? duration : duration.toString().trim();
    if (typeof raw === 'string' && raw.includes(':')) {
        const parts = raw.split(':');
        if (parts.length === 2 && parts[1].length <= 2) return raw;
        if (parts.length === 3) return raw;
    }
    const totalSeconds = typeof raw === 'string' ? parseFloat(raw) : raw;
    if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Videos() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteTitle, setDeleteTitle] = useState('');

    const formatDateIST = (dateStr: string) => {
        if (!dateStr) return '—';
        const utcDateStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
        return new Date(utcDateStr).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    };

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/videos`);
            setVideos(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVideos(); }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API}/videos/${deleteId}`);
            setDeleteId(null);
            fetchVideos();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete video');
        }
    };

    const filtered = videos.filter(v =>
        v.title?.toLowerCase().includes(search.toLowerCase()) ||
        v.username?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Video Management</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                        {loading ? <Skeleton width="80px" height="13px" /> : `${videos.length} total videos`}
                    </p>
                </div>
            </div>

            <div className="page-body animate-in">
                {/* Search */}
                <div style={{ position: 'relative', maxWidth: '420px', marginBottom: '24px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or channel..." style={{ paddingLeft: '42px' }} />
                </div>

                {loading ? (
                    <TableSkeleton cols={8} rows={8} />
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <Video size={48} />
                        <p>No videos found</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Video</th>
                                    <th>Channel</th>
                                    <th>Duration</th>
                                    <th>Views</th>
                                    <th>Likes</th>
                                    <th>Reports</th>
                                    <th>Uploaded</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(v => (
                                    <tr key={v.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {v.thumbnail_url ? (
                                                    <img src={v.thumbnail_url} alt="" style={{ width: '80px', height: '45px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-tertiary)' }} />
                                                ) : (
                                                    <video src={`${v.video_url}#t=1.0`} style={{ width: '80px', height: '45px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-tertiary)' }} preload="metadata" muted playsInline />
                                                )}
                                                <span style={{ fontWeight: 600, fontSize: '13px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                    {v.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>{v.username}</td>
                                        <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatDuration(v.duration)}</td>
                                        <td style={{ fontSize: '13px' }}>{v.views?.toLocaleString()}</td>
                                        <td style={{ fontSize: '13px' }}>{v.likes_count}</td>
                                        <td>
                                            {parseInt(v.reports_count) > 0 ? (
                                                <span className="badge badge-pending">{v.reports_count}</span>
                                            ) : (
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>0</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateIST(v.created_at)}</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(v.id); setDeleteTitle(v.title); }}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--danger)' }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Delete Video?</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>
                                "{deleteTitle}"
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                                This will permanently delete this video and notify the uploader. This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
                                <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }} onClick={handleDelete}>Delete Video</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
