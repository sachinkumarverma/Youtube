import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Flame, Gamepad2, UserSquare, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLinkClick = () => {
    if (window.innerWidth <= 1024) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`} onClick={handleLinkClick}>
        <Home size={22} />
        <span className="sidebar-text">{t('home')}</span>
      </Link>
      <Link to="/explore" className={`sidebar-link ${isActive('/explore') ? 'active' : ''}`} onClick={handleLinkClick}>
        <Compass size={22} />
        <span className="sidebar-text">{t('explore')}</span>
      </Link>
      <Link to="/subscriptions" className={`sidebar-link ${isActive('/subscriptions') ? 'active' : ''}`} onClick={handleLinkClick}>
        <PlaySquare size={22} />
        <span className="sidebar-text">{t('subscriptions')}</span>
      </Link>

      <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>

      <Link to="/history" className={`sidebar-link ${isActive('/history') ? 'active' : ''}`} onClick={handleLinkClick}>
        <History size={22} />
        <span className="sidebar-text">{t('history')}</span>
      </Link>
      <Link to="/watch-later" className={`sidebar-link ${isActive('/watch-later') ? 'active' : ''}`} onClick={handleLinkClick}>
        <Clock size={22} />
        <span className="sidebar-text">{t('watchLater')}</span>
      </Link>
      <Link to="/liked" className={`sidebar-link ${isActive('/liked') ? 'active' : ''}`} onClick={handleLinkClick}>
        <ThumbsUp size={22} />
        <span className="sidebar-text">{t('likedVideos')}</span>
      </Link>

      <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>

      <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '8px 16px', fontWeight: 600, letterSpacing: '0.4px', marginTop: '12px' }}>{t('explore').toUpperCase()}</h3>
      <Link to="/trending" className={`sidebar-link ${isActive('/trending') ? 'active' : ''}`} onClick={handleLinkClick}>
        <Flame size={22} />
        <span className="sidebar-text">{t('trending')}</span>
      </Link>
      <Link to="/gaming" className={`sidebar-link ${isActive('/gaming') ? 'active' : ''}`} onClick={handleLinkClick}>
        <Gamepad2 size={22} />
        <span className="sidebar-text">{t('gaming')}</span>
      </Link>

      {user.id && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>
          <Link to={`/channel/${user.id}`} className={`sidebar-link ${isActive(`/channel/${user.id}`) ? 'active' : ''}`} onClick={handleLinkClick}>
            <UserSquare size={22} />
            <span className="sidebar-text">{t('yourChannel')}</span>
          </Link>
          <Link to="/analytics" className={`sidebar-link ${isActive('/analytics') ? 'active' : ''}`} onClick={handleLinkClick}>
            <BarChart3 size={22} />
            <span className="sidebar-text">{t('analytics')}</span>
          </Link>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
