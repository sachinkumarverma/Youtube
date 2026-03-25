import { Search, Bell, Video, User, Menu, Mic } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="icon-btn">
          <Menu size={24} />
        </button>
        <a href="/" className="logo">
          <Video className="logo-icon" size={28} />
          ViewTube
        </a>
      </div>

      <div className="nav-middle" style={{display: 'flex', gap: '12px'}}>
        <div className="search-bar">
          <input type="text" className="search-input" placeholder="Search..." />
          <button className="icon-btn" style={{padding: '4px'}}>
            <Search size={20} />
          </button>
        </div>
        <button className="icon-btn" style={{background: 'var(--bg-secondary)'}}>
          <Mic size={20} />
        </button>
      </div>

      <div className="nav-right">
        <button className="icon-btn">
          <Video size={24} />
        </button>
        <button className="icon-btn">
          <Bell size={24} />
        </button>
        <button className="icon-btn">
          <User size={24} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
