import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Flame, Music, Gamepad2 } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <a href="/" className="sidebar-link active">
        <Home size={22} />
        <span>Home</span>
      </a>
      <a href="#" className="sidebar-link">
        <Compass size={22} />
        <span>Explore</span>
      </a>
      <a href="#" className="sidebar-link">
        <PlaySquare size={22} />
        <span>Subscriptions</span>
      </a>
      
      <div style={{height: '1px', background: 'var(--border)', margin: '12px 0'}}></div>
      
      <a href="#" className="sidebar-link">
        <History size={22} />
        <span>History</span>
      </a>
      <a href="#" className="sidebar-link">
        <Clock size={22} />
        <span>Watch Later</span>
      </a>
      <a href="#" className="sidebar-link">
        <ThumbsUp size={22} />
        <span>Liked Videos</span>
      </a>

      <div style={{height: '1px', background: 'var(--border)', margin: '12px 0'}}></div>

      <h3 style={{color: 'var(--text-secondary)', fontSize: '14px', padding: '8px 16px', fontWeight: 600}}>EXPLORE</h3>
      <a href="#" className="sidebar-link">
        <Flame size={22} />
        <span>Trending</span>
      </a>
      <a href="#" className="sidebar-link">
        <Music size={22} />
        <span>Music</span>
      </a>
      <a href="#" className="sidebar-link">
        <Gamepad2 size={22} />
        <span>Gaming</span>
      </a>
    </aside>
  );
};

export default Sidebar;
