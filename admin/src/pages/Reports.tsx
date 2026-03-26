import { useState, useEffect } from 'react';
import axios from 'axios';
import { Flag, Trash2, XCircle, Send, X, Check } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api/admin';

export default function Reports() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [reviewing, setReviewing] = useState<any>(null);
    const [reviewAction, setReviewAction] = useState('');
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const url = statusFilter ? `${API}/reports?status=${statusFilter}` : `${API}/reports`;
            const res = await axios.get(url);
            setReports(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, [statusFilter]);

    const handleReview = async () => {
        if (!reviewing || !reviewAction) return;
        setSubmitting(true);
        try {
            await axios.put(`${API}/reports/${reviewing.id}/review`, { action: reviewAction, feedback });
            setReviewing(null);
            setReviewAction('');
            setFeedback('');
            fetchReports();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to review report');
        } finally { setSubmitting(false); }
    };

    const getBadgeClass = (status: string) => {
        if (status === 'pending') return 'badge-pending';
        if (status === 'deleted') return 'badge-deleted';
        if (status === 'rejected') return 'badge-rejected';
        return 'badge-reviewed';
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Reports</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Review and manage reported videos</p>
                </div>
            </div>

            <div className="page-body animate-in">
                {/* Filters */}
                <div className="filter-bar" style={{ marginBottom: '24px' }}>
                    {['', 'pending', 'reviewed', 'deleted', 'rejected'].map(f => (
                        <button key={f} className={`filter-pill ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
                            {f || 'All'}
                        </button>
                    ))}
                </div>

                {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading reports...</p> : reports.length === 0 ? (
                    <div className="empty-state">
                        <Flag size={48} />
                        <p>No reports found</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {reports.map(r => (
                            <div key={r.id} className="report-card">
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className={`badge ${getBadgeClass(r.status)}`}>{r.status}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                        Video: {r.video_title}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        Reported by <strong style={{ color: 'var(--text-primary)' }}>{r.reporter_username}</strong> • Uploaded by <strong style={{ color: 'var(--text-primary)' }}>{r.uploader_username}</strong>
                                    </div>
                                    <div style={{ fontSize: '13px', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontStyle: 'italic', borderLeft: '3px solid var(--warning)' }}>
                                        "{r.reason}"
                                    </div>
                                    {r.admin_feedback && (
                                        <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--info)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <Check size={14} /> Admin: {r.admin_feedback}
                                        </div>
                                    )}
                                </div>

                                {r.status === 'pending' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                        <button className="btn btn-danger btn-sm" onClick={() => { setReviewing(r); setReviewAction('delete'); }}>
                                            <Trash2 size={14} /> Delete Video
                                        </button>
                                        <button className="btn btn-info btn-sm" onClick={() => { setReviewing(r); setReviewAction('feedback'); }}>
                                            <Send size={14} /> Feedback
                                        </button>
                                        <button className="btn btn-sm" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }} onClick={() => { setReviewing(r); setReviewAction('reject'); }}>
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewing && (
                <div className="modal-overlay" onClick={() => { setReviewing(null); setFeedback(''); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Review Report</h3>
                            <button onClick={() => { setReviewing(null); setFeedback(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '14px', marginBottom: '6px' }}><strong>Video:</strong> {reviewing.video_title}</p>
                            <p style={{ fontSize: '14px', marginBottom: '6px' }}><strong>Reason:</strong> {reviewing.reason}</p>
                            <p style={{ fontSize: '14px' }}>
                                <strong>Action:</strong>{' '}
                                <span style={{ fontWeight: 700, textTransform: 'capitalize', color: reviewAction === 'delete' ? 'var(--danger)' : reviewAction === 'reject' ? '#a855f7' : 'var(--info)' }}>
                                    {reviewAction}
                                </span>
                            </p>
                        </div>

                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label className="input-label">
                                {reviewAction === 'delete' ? 'Reason for deletion (optional)' : reviewAction === 'reject' ? 'Reason for rejection (optional)' : 'Your feedback to the uploader'}
                            </label>
                            <textarea className="input" value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} style={{ resize: 'vertical' }} placeholder="Write your message here..." />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setReviewing(null); setFeedback(''); }}>Cancel</button>
                            <button
                                className="btn"
                                style={{ flex: 1, background: reviewAction === 'delete' ? 'var(--danger)' : reviewAction === 'reject' ? '#a855f7' : 'var(--info)', color: '#fff' }}
                                onClick={handleReview}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : reviewAction === 'delete' ? 'Delete Video' : reviewAction === 'reject' ? 'Reject Report' : 'Send Feedback'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
