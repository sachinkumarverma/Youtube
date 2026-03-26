import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Video, Flag, FileText, LogOut, Shield } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    };

    const links = [
        { path: '/', icon: BarChart3, label: 'Dashboard' },
        { path: '/videos', icon: Video, label: 'Videos' },
        { path: '/reports', icon: Flag, label: 'Reports' },
        { path: '/logs', icon: FileText, label: 'Audit Logs' },
    ];

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Shield size={24} color="#6366f1" />
                    <h1>ViewTube Admin</h1>
                </div>
                <nav className="sidebar-nav">
                    {links.map(l => (
                        <button
                            key={l.path}
                            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
                            onClick={() => navigate(l.path)}
                        >
                            <l.icon size={20} />
                            {l.label}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '14px' }}>
                            {admin.username?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{admin.username || 'Admin'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{admin.email || ''}</div>
                        </div>
                    </div>
                    <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>
            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
}
