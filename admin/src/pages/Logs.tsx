import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FileText, Filter, RefreshCw, AlertCircle, User, Terminal, ChevronRight, Download } from 'lucide-react';
import TableSkeleton from '../components/TableSkeleton';
import { API_BASE_URL } from '../constants';

const API = API_BASE_URL;

export default function Logs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ action: '', from: '', to: '' });
    const [limit, setLimit] = useState(25);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const cacheRef = useRef<Record<string, any>>({});

    const formatDateIST = (dateStr: string) => {
        if (!dateStr) return '—';
        try {
            const iso = (dateStr.includes('Z') || dateStr.includes('+')) ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
            const date = new Date(iso);

            return new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true
            }).format(date);
        } catch (e) { return dateStr; }
    };

    const downloadLogs = (format: 'json' | 'csv') => {
        let content = '';
        const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;

        if (format === 'json') {
            content = JSON.stringify(logs, null, 2);
        } else {
            const headers = ['Action', 'Entity Type', 'Entity ID', 'Initiator', 'Details', 'Time'];
            const rows = logs.map(l => [
                l.action,
                l.entity_type,
                l.entity_id || '',
                l.username || 'System',
                (typeof l.details === 'string' ? l.details : JSON.stringify(l.details)).replace(/"/g, '""'),
                formatDateIST(l.created_at)
            ]);
            content = [headers, ...rows].map(r => `"${r.join('","')}"`).join('\n');
        }

        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setShowDownloadMenu(false);
    };

    const fetchLogs = async (page = 1, currentFilters = filters, currentLimit = limit) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: currentLimit.toString() });
            if (currentFilters.action) params.set('action', currentFilters.action);
            if (currentFilters.from) params.set('from', currentFilters.from);
            if (currentFilters.to) params.set('to', currentFilters.to);

            const cacheKey = params.toString();
            if (cacheRef.current[cacheKey]) {
                const cachedData = cacheRef.current[cacheKey];
                setLogs(cachedData.logs || []);
                setMeta({ total: cachedData.total, page: cachedData.page, totalPages: cachedData.totalPages });
                setLoading(false);
                return;
            }

            const res = await axios.get(`${API}/logs?${params}`);
            cacheRef.current[cacheKey] = res.data;
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
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <button className="btn btn-ghost" onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
                            <Download size={16} /> Download
                        </button>
                        {showDownloadMenu && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 10, minWidth: '120px', padding: '4px', marginTop: '4px' }}>
                                <button className="btn btn-ghost btn-sm" style={{ width: '100%', textAlign: 'left', display: 'block' }} onClick={() => downloadLogs('json')}>JSON Format</button>
                                <button className="btn btn-ghost btn-sm" style={{ width: '100%', textAlign: 'left', display: 'block' }} onClick={() => downloadLogs('csv')}>CSV Format</button>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-ghost" onClick={() => fetchLogs(meta.page)}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div className="filter-bar" style={{ marginBottom: '24px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="input-group">
                        <label className="input-label">Event Type</label>
                        <select className="input" value={filters.action} onChange={e => {
                            const newAction = e.target.value;
                            setFilters(p => ({ ...p, action: newAction }));
                            fetchLogs(1, { ...filters, action: newAction });
                        }} style={{ minWidth: '220px' }}>
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
                        <button className="btn btn-ghost" onClick={() => {
                            const emptyFilters = { action: '', from: '', to: '' };
                            setFilters(emptyFilters);
                            fetchLogs(1, emptyFilters);
                        }}>
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
                                                {formatDateIST(l.created_at)}
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

                        {/* Pagination and Limit */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Logs per page:</span>
                                <select
                                    className="input"
                                    style={{ padding: '4px 8px', fontSize: '13px', minWidth: '70px', height: '32px' }}
                                    value={limit}
                                    onChange={e => {
                                        const newLimit = parseInt(e.target.value);
                                        setLimit(newLimit);
                                        fetchLogs(1, filters, newLimit);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            {meta.totalPages > 1 && (
                                <div className="pagination" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {(() => {
                                        const pages = [];
                                        const maxPagesToShow = 5;
                                        let startPage = Math.max(1, meta.page - Math.floor(maxPagesToShow / 2));
                                        let endPage = Math.min(meta.totalPages, startPage + maxPagesToShow - 1);

                                        if (endPage - startPage + 1 < maxPagesToShow) {
                                            startPage = Math.max(1, endPage - maxPagesToShow + 1);
                                        }

                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(i);
                                        }

                                        return (
                                            <>
                                                {startPage > 1 && <span style={{ color: 'var(--text-secondary)', padding: '6px' }}>...</span>}
                                                {pages.map(p => (
                                                    <button key={p} className={`page-btn ${meta.page === p ? 'active' : ''}`} onClick={() => fetchLogs(p)}>
                                                        {p}
                                                    </button>
                                                ))}
                                                {endPage < meta.totalPages && <span style={{ color: 'var(--text-secondary)', padding: '6px' }}>...</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
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
                                        <label className="input-label">Platform Time (IST)</label>
                                        <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '13px' }}>
                                            {formatDateIST(selectedLog.created_at)}
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
