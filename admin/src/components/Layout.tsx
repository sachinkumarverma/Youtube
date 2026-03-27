import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Video, Flag, FileText, LogOut, Shield, Users, MessageSquare, X, Menu } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    };

    const links = [
        { path: '/', icon: BarChart3, label: 'Dashboard' },
        { path: '/users', icon: Users, label: 'Users' },
        { path: '/videos', icon: Video, label: 'Videos' },
        { path: '/comments', icon: MessageSquare, label: 'Comments' },
        { path: '/reports', icon: Flag, label: 'Reports' },
        { path: '/logs', icon: FileText, label: 'Audit Logs' },
    ];

    return (
        <div className={`app ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <button className="mobile-toggle" onClick={toggleSidebar}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Shield size={24} color="#6366f1" />
                    <h1>ViewTube Admin</h1>
                </div>
                <nav className="sidebar-nav">
                    {links.map(l => (
                        <button
                            key={l.path}
                            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
                            onClick={() => { navigate(l.path); setIsSidebarOpen(false); }}
                        >
                            <l.icon size={20} />
                            <span>{l.label}</span>
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
                        <LogOut size={18} /> <span>Sign Out</span>
                    </button>
                </div>
            </aside>
            <div className="main-content" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
                <Outlet />
            </div>
        </div>
    );
}
