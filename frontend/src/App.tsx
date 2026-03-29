import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import VideoList from './pages/VideoList';
import Login from './pages/Login';
import Register from './pages/Register';
import Subscriptions from './pages/Subscriptions';
import ChannelDetail from './pages/ChannelDetail';
import Upload from './pages/Upload';
import './index.css';
import { ToastProvider } from './components/Toast';
import OfflineBanner from './components/OfflineBanner';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && isSidebarOpen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <ToastProvider>
      <OfflineBanner />
      <Router>
        <div className="app-container">
          <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="main-wrapper">
            {isSidebarOpen && (
              <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}
            <Sidebar isOpen={isSidebarOpen} />
            <main className="page-content" onClick={() => window.innerWidth <= 768 && isSidebarOpen && setIsSidebarOpen(false)}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/video/:id" element={<VideoPlayer />} />
                <Route path="/explore" element={<VideoList endpoint="videos/explore" title="Explore" />} />
                <Route path="/trending" element={<VideoList endpoint="videos/trending" title="Trending" />} />
                <Route path="/gaming" element={<VideoList endpoint="videos?category=Gaming" title="Gaming" />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/channel/:id" element={<ChannelDetail />} />
                <Route path="/upload" element={<Upload />} />

                <Route path="/history" element={<VideoList endpoint="user/history" title="History" />} />
                <Route path="/watch-later" element={<VideoList endpoint="user/watch-later" title="Watch Later" />} />
                <Route path="/liked" element={<VideoList endpoint="user/liked" title="Liked Videos" />} />
                <Route
                  path="/channel"
                  element={user ? <Navigate to={`/channel/${user.id}`} /> : <Navigate to="/login" />}
                />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
