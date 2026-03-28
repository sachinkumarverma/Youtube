import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MessageSquare, Trash2, Video, Calendar } from 'lucide-react';
import TableSkeleton from '../components/TableSkeleton';
import Skeleton from '../components/Skeleton';
import { API_BASE_URL } from '../constants';

interface CommentData {
    id: string;
    content: string;
    user_id: string;
    video_id: string;
    created_at: string;
    username: string;
    video_title: string;
}

export default function Comments() {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async (id: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/comments/${id}`);
            setComments(comments.filter(c => c.id !== id));
        } catch (err) {
            alert('Failed to delete comment');
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Comment Moderation</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor and moderate all user discussions across videos</p>
                    </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
                    {loading ? <Skeleton width="80px" height="18px" /> : `${comments.length} Total Comments`}
                </div>
            </div>

            <div className="page-body">
                {loading ? (
                    <TableSkeleton cols={5} rows={10} />
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '180px' }}>User</th>
                                    <th>Comment Content</th>
                                    <th>Video</th>
                                    <th>Posted</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comments.map(comment => (
                                    <tr key={comment.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', display: 'grid', placeItems: 'center' }}>
                                                    <User size={14} />
                                                </div>
                                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{comment.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '14px', lineHeight: '1.5', maxWidth: '400px', whiteSpace: 'pre-wrap' }}>
                                            {comment.content}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: '600', fontSize: '13px' }}>
                                                    <Video size={13} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comment.video_title}</span>
                                                </div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{comment.video_id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                <Calendar size={12} />
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => deleteComment(comment.id)} className="btn btn-sm btn-danger" title="Delete Comment">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {comments.length === 0 && (
                            <div className="empty-state">No comments to display.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
