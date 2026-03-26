import { Search, Bell, Video, User, Menu, Mic, Sun, Moon, X, Languages, LogOut, Trash2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notifications, setNotifications] = useState<any[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try { setUser(JSON.parse(userStr)); } catch (e) { }
      } else {
        setUser(null);
      }
    };

    updateUser();
    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowUserDropdown(false);
    navigate('/');
    window.location.reload();
  };

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://127.0.0.1:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://127.0.0.1:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="icon-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <Link to="/" className="logo">
          <Video className="logo-icon" size={28} />
          ViewTube
        </Link>
      </div>

      <div className="nav-middle" style={{ display: 'flex', gap: '12px' }}>
        <form className="search-bar" onSubmit={handleSearch}>
          <input type="text" className="search-input" placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button type="button" className="icon-btn" onClick={() => setSearchQuery('')} title="Clear search">
              <X size={20} />
            </button>
          )}
          <button type="submit" className="icon-btn" style={{ padding: '4px' }}>
            <Search size={20} />
          </button>
        </form>
        <button className="icon-btn" style={{ background: 'var(--bg-secondary)' }}>
          <Mic size={20} />
        </button>
      </div>

      <div className="nav-right">
        <button className="icon-btn" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} title="Change Language" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          <Languages size={24} />
          <span style={{ textTransform: 'uppercase' }}>{language}</span>
        </button>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
        {isLoggedIn && (
          <Link to="/upload" className="icon-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <Video size={24} />
            <span style={{ display: 'none' }}>{t('upload')}</span>
          </Link>
        )}

        <div style={{ position: 'relative' }} ref={notificationDropdownRef}>
          <button className="icon-btn" onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}>
            <Bell size={24} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#cc0000', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotificationDropdown && (
            <div className="user-dropdown" style={{ right: 0, width: '360px', maxHeight: '480px', overflowY: 'auto' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 'bold', fontSize: '16px' }}>
                {t('notifications')}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No notifications</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); if (n.video_id) navigate(`/video/${n.video_id}`); }}
                    style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: n.is_read ? 'transparent' : 'rgba(62, 166, 255, 0.05)',
                      display: 'flex', gap: '12px', position: 'relative'
                    }}
                    className="notification-item"
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: n.is_read ? 'normal' : 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>{n.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.content}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(62, 166, 255, 0.8)', marginTop: '4px' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={(e) => deleteNotification(n.id, e)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                    {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3ea6ff', position: 'absolute', left: '4px', top: '24px' }}></div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <div style={{ position: 'relative' }} ref={userDropdownRef}>
            <button className="icon-btn" onClick={() => setShowUserDropdown(!showUserDropdown)} title="Account" style={{ background: 'var(--bg-hover)', borderRadius: '50%', padding: user?.avatar_url ? '0' : '8px', overflow: 'hidden', width: '40px', height: '40px' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={24} color="var(--text-primary)" />
              )}
            </button>
            {showUserDropdown && (
              <div className="user-dropdown">
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)' }}>{user?.username || 'User'}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{user?.email || ''}</div>
                </div>

                <Link to={`/channel/${user?.id}`} onClick={() => setShowUserDropdown(false)} style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '15px' }}>
                  <User size={18} />
                  {t('yourChannel')}
                </Link>

                <div style={{ height: '1px', background: 'var(--border)' }}></div>

                <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'transparent', border: '1px solid #3ea6ff', color: '#3ea6ff', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold' }}>
              <User size={20} />
              {t('login')}
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
