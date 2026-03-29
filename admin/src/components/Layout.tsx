import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Video, Flag, FileText, LogOut, Shield, Users, MessageSquare, Menu } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 640);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Lock body scroll on mobile when sidebar is open
    useEffect(() => {
        const isMobile = window.innerWidth <= 640;
        if (isMobile && isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isSidebarOpen]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    };

    const mainLinks = [
        { path: '/', icon: BarChart3, label: 'Dashboard' },
        { path: '/users', icon: Users, label: 'Users' },
        { path: '/videos', icon: Video, label: 'Videos' },
        { path: '/comments', icon: MessageSquare, label: 'Comments' },
    ];

    const manageLinks = [
        { path: '/reports', icon: Flag, label: 'Reports' },
        { path: '/logs', icon: FileText, label: 'Audit Logs' },
    ];

    return (
        <div className="admin-app">
            <header className="admin-navbar">
                <div className="nav-left">
                    <button className="icon-btn" onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                        <Menu size={24} />
                    </button>
                    <div className="branding" style={{ paddingLeft: '12px' }}>
                        <Shield size={24} color="#6366f1" style={{ flexShrink: 0 }} />
                        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', background: 'linear-gradient(135deg, var(--accent), #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            ViewTube Admin
                        </h1>
                    </div>
                </div>
            </header>

            <div className="admin-body">
                {isSidebarOpen && window.innerWidth <= 640 && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
                )}
                <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
                    {mainLinks.map(l => (
                        <button
                            key={l.path}
                            className={`sidebar-link ${location.pathname === l.path ? 'active' : ''}`}
                            onClick={() => { navigate(l.path); if (window.innerWidth <= 640) setIsSidebarOpen(false); }}
                        >
                            <l.icon size={22} />
                            <span className="sidebar-text">{l.label}</span>
                        </button>
                    ))}

                    <div className="sidebar-divider" />

                    {!isSidebarOpen ? null : (
                        <h3 className="sidebar-section-title">MANAGE</h3>
                    )}
                    {manageLinks.map(l => (
                        <button
                            key={l.path}
                            className={`sidebar-link ${location.pathname === l.path ? 'active' : ''}`}
                            onClick={() => { navigate(l.path); if (window.innerWidth <= 640) setIsSidebarOpen(false); }}
                        >
                            <l.icon size={22} />
                            <span className="sidebar-text">{l.label}</span>
                        </button>
                    ))}

                    <div style={{ flex: 1 }} />

                    <div className="sidebar-divider" />
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {admin.username?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        {isSidebarOpen && (
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.username || 'Admin'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.email || ''}</div>
                            </div>
                        )}
                    </div>
                    <button className="sidebar-link logout-link" onClick={handleLogout}>
                        <LogOut size={22} />
                        <span className="sidebar-text">Sign Out</span>
                    </button>
                </aside>
                <div className="main-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
