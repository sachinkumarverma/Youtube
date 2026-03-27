import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Filter, RefreshCw, AlertCircle, User, Terminal, ChevronRight } from 'lucide-react';
import TableSkeleton from '../components/TableSkeleton';

const API = 'http://127.0.0.1:5000/api/admin';

export default function Logs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ action: '', from: '', to: '' });
    const [selectedLog, setSelectedLog] = useState<any>(null);

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
        if (!action) return 'var(--text-secondary)';
        if (action.includes('ERROR')) return 'var(--danger)';
        if (action.includes('DELETED')) return 'var(--danger)';
        if (action.includes('REJECTED')) return '#a855f7';
        if (action.includes('FEEDBACK')) return 'var(--info)';
        if (action.includes('SUBMITTED')) return 'var(--warning)';
        if (action.includes('LOGIN')) return 'var(--success)';
        return 'var(--text-secondary)';
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Audit Trail & System Logs</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{meta.total} events tracked globally</p>
                </div>
                <button className="btn btn-ghost" onClick={() => fetchLogs(meta.page)}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div className="filter-bar" style={{ marginBottom: '24px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="input-group">
                        <label className="input-label">Event Type</label>
                        <select className="input" value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} style={{ minWidth: '220px' }}>
                            <option value="">All Events</option>
                            <option value="SYSTEM_ERROR">System Errors</option>
                            <option value="REPORT_SUBMITTED">User Reports</option>
                            <option value="ADMIN_VIDEO_DELETED">Video Removals</option>
                            <option value="ADMIN_REPORT_REJECTED">Report Rejections</option>
                            <option value="ADMIN_FEEDBACK_SENT">Admin Feedbacks</option>
                            <option value="ADMIN_LOGIN">Admin Logins</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Date From</label>
                        <input className="input" type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Date To</label>
                        <input className="input" type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={() => fetchLogs(1)}>
                            <Filter size={14} /> Filter
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setFilters({ action: '', from: '', to: '' }); fetchLogs(1); }}>
                            Reset
                        </button>
                    </div>
                </div>

                {loading && logs.length === 0 ? (
                    <TableSkeleton cols={6} rows={15} />
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No activity logs found for selected filters</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Context/Entity</th>
                                        <th>Initiator</th>
                                        <th>Summary</th>
                                        <th>Time</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(l => (
                                        <tr key={l.id} className="admin-table-row">
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {l.action === 'SYSTEM_ERROR' ? <AlertCircle size={14} color="var(--danger)" /> : <Terminal size={14} color="var(--text-secondary)" />}
                                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: getActionColor(l.action), background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '6px' }}>
                                                        {l.action}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '13px' }}>
                                                    <span style={{ opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', marginRight: '6px' }}>{l.entity_type}</span>
                                                    {l.entity_id && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>#{l.entity_id.substring(0, 8)}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <User size={12} className={l.username ? '' : 'opacity-20'} />
                                                    {l.username || <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>System Bot</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {new Date(l.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-sm btn-ghost" onClick={() => setSelectedLog(l)}>
                                                    <ChevronRight size={16} />
                                                </button>
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

                {/* Log Detail Modal */}
                {selectedLog && (
                    <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                            <div className="modal-header">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Terminal size={18} color="var(--accent)" /> Event Details
                                </h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLog(null)}>✕</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label className="input-label">Action</label>
                                        <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontWeight: 700, fontSize: '13px', color: getActionColor(selectedLog.action) }}>
                                            {selectedLog.action}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="input-label">Platform Time</label>
                                        <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '13px' }}>
                                            {new Date(selectedLog.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Payload Data</label>
                                    <pre style={{
                                        padding: '16px',
                                        background: '#000',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#0f0',
                                        fontFamily: 'monospace',
                                        maxHeight: '300px',
                                        overflow: 'auto',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {JSON.stringify(typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details || '{}') : selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label className="input-label">Initiator</label>
                                        <div style={{ fontSize: '14px' }}>{selectedLog.username || 'System Process'}</div>
                                    </div>
                                    <div>
                                        <label className="input-label">Entity Ref</label>
                                        <div style={{ fontSize: '14px' }}>{selectedLog.entity_type} / {selectedLog.entity_id || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
