import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Filter, RefreshCw } from 'lucide-react';

const API = 'http://127.0.0.1:5000/api/admin';

export default function Logs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ action: '', from: '', to: '' });

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '25' });
            if (filters.action) params.set('action', filters.action);
            if (filters.from) params.set('from', filters.from);
            if (filters.to) params.set('to', filters.to);
            const res = await axios.get(`${API}/logs?${params}`);
            setLogs(res.data.logs || []);
            setMeta({ total: res.data.total, page: res.data.page, totalPages: res.data.totalPages });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    const getActionColor = (action: string) => {
        if (action.includes('DELETED')) return 'var(--danger)';
        if (action.includes('REJECTED')) return '#a855f7';
        if (action.includes('FEEDBACK')) return 'var(--info)';
        if (action.includes('SUBMITTED')) return 'var(--warning)';
        return 'var(--text-secondary)';
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Audit Logs</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{meta.total} total entries</p>
                </div>
                <button className="btn btn-ghost" onClick={() => fetchLogs(meta.page)}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="page-body animate-in">
                {/* Filters */}
                <div className="filter-bar" style={{ marginBottom: '24px' }}>
                    <div className="input-group">
                        <label className="input-label">Action</label>
                        <select className="input" value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} style={{ minWidth: '200px' }}>
                            <option value="">All Actions</option>
                            <option value="REPORT_SUBMITTED">Report Submitted</option>
                            <option value="ADMIN_VIDEO_DELETED">Video Deleted</option>
                            <option value="ADMIN_REPORT_REJECTED">Report Rejected</option>
                            <option value="ADMIN_FEEDBACK_SENT">Feedback Sent</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">From</label>
                        <input className="input" type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">To</label>
                        <input className="input" type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={() => fetchLogs(1)}>
                            <Filter size={14} /> Apply
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setFilters({ action: '', from: '', to: '' }); fetchLogs(1); }}>
                            Clear
                        </button>
                    </div>
                </div>

                {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading logs...</p> : logs.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No logs found</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>User</th>
                                        <th>Details</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(l => (
                                        <tr key={l.id}>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: getActionColor(l.action), background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                                    {l.action}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <span style={{ textTransform: 'capitalize' }}>{l.entity_type}</span>
                                                {l.entity_id && <span style={{ fontFamily: 'monospace', fontSize: '11px', marginLeft: '6px', opacity: 0.7 }}>#{l.entity_id.substring(0, 8)}</span>}
                                            </td>
                                            <td style={{ fontSize: '13px' }}>{l.username || <span style={{ color: 'var(--text-secondary)' }}>System</span>}</td>
                                            <td style={{ maxWidth: '300px' }}>
                                                {l.details ? (
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {new Date(l.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta.totalPages > 1 && (
                            <div className="pagination">
                                {Array.from({ length: Math.min(meta.totalPages, 10) }, (_, i) => (
                                    <button key={i} className={`page-btn ${meta.page === i + 1 ? 'active' : ''}`} onClick={() => fetchLogs(i + 1)}>
                                        {i + 1}
                                    </button>
                                ))}
                                {meta.totalPages > 10 && <span style={{ color: 'var(--text-secondary)', padding: '6px' }}>...</span>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
