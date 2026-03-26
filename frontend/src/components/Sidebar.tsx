import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Flame, Gamepad2, UserSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
        <Home size={22} />
        <span className="sidebar-text">{t('home')}</span>
      </Link>
      <Link to="/explore" className={`sidebar-link ${isActive('/explore') ? 'active' : ''}`}>
        <Compass size={22} />
        <span className="sidebar-text">{t('explore')}</span>
      </Link>
      <Link to="/subscriptions" className={`sidebar-link ${isActive('/subscriptions') ? 'active' : ''}`}>
        <PlaySquare size={22} />
        <span className="sidebar-text">{t('subscriptions')}</span>
      </Link>

      <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>

      <Link to="/history" className={`sidebar-link ${isActive('/history') ? 'active' : ''}`}>
        <History size={22} />
        <span className="sidebar-text">{t('history')}</span>
      </Link>
      <Link to="/watch-later" className={`sidebar-link ${isActive('/watch-later') ? 'active' : ''}`}>
        <Clock size={22} />
        <span className="sidebar-text">{t('watchLater')}</span>
      </Link>
      <Link to="/liked" className={`sidebar-link ${isActive('/liked') ? 'active' : ''}`}>
        <ThumbsUp size={22} />
        <span className="sidebar-text">{t('likedVideos')}</span>
      </Link>

      <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>

      <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '8px 16px', fontWeight: 600, letterSpacing: '0.4px', marginTop: '12px' }}>{t('explore').toUpperCase()}</h3>
      <Link to="/trending" className={`sidebar-link ${isActive('/trending') ? 'active' : ''}`}>
        <Flame size={22} />
        <span className="sidebar-text">{t('trending')}</span>
      </Link>
      <Link to="/gaming" className={`sidebar-link ${isActive('/gaming') ? 'active' : ''}`}>
        <Gamepad2 size={22} />
        <span className="sidebar-text">{t('gaming')}</span>
      </Link>

      {user.id && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>
          <Link to={`/channel/${user.id}`} className={`sidebar-link ${isActive(`/channel/${user.id}`) ? 'active' : ''}`}>
            <UserSquare size={22} />
            <span className="sidebar-text">{t('yourChannel')}</span>
          </Link>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
