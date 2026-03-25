import { useState, useEffect } from 'react';
// import axios from 'axios';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views: number;
  user: { username: string };
  created_at: string;
}

const CATEGORIES = ["All", "Gaming", "Music", "Live", "Programming", "News", "Podcasts", "Sports", "Mixes"];

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    // We fetch from the backend later, for now we will setup dummy data to see the UI.
    const dummyVideos: Video[] = [
      {
        id: "1",
        title: "Building a YouTube Clone with React & Node.js - Full Tutorial 2026",
        thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
        views: 120450,
        user: { username: "CodeMaster" },
        created_at: "2026-03-24T10:00:00Z"
      },
      {
        id: "2",
        title: "Lofi Hip Hop Radio - Beats to Relax/Study to",
        thumbnail_url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200&auto=format&fit=crop",
        views: 2500000,
        user: { username: "ChilledCow" },
        created_at: "2026-03-20T10:00:00Z"
      },
      {
        id: "3",
        title: "Top 10 Programming Languages to Learn in 2026",
        thumbnail_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
        views: 45000,
        user: { username: "TechGuru" },
        created_at: "2026-03-25T08:00:00Z"
      },
      {
        id: "4",
        title: "Epic Space Ambience - 4K Deep Space Exploration",
        thumbnail_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
        views: 980000,
        user: { username: "SpaceVibes" },
        created_at: "2026-03-10T10:00:00Z"
      },
      {
        id: "5",
        title: "The Best Modern Architecture of 2026",
        thumbnail_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
        views: 32000,
        user: { username: "DesignWeekly" },
        created_at: "2026-03-22T10:00:00Z"
      },
      {
        id: "6",
        title: "Cyberpunk 2077 - Next Gen Graphics Mod Preview",
        thumbnail_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
        views: 560000,
        user: { username: "GamerProX" },
        created_at: "2026-03-21T10:00:00Z"
      }
    ];
    setVideos(dummyVideos);
  }, []);

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
  };

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    return days === 0 ? 'Today' : `${days} days ago`;
  };

  return (
    <div className="animate-fade-in">
      <div className="categories">
        {CATEGORIES.map(category => (
          <button 
            key={category} 
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="video-grid">
        {videos.map(video => (
          <div className="video-card" key={video.id}>
            <div className="thumbnail-wrapper">
              <img src={video.thumbnail_url || 'https://via.placeholder.com/400x225'} alt={video.title} className="thumbnail-img" />
            </div>
            <div className="video-card-info">
              <div className="avatar">
                {video.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="video-details">
                <h3 className="video-title">{video.title}</h3>
                <span className="channel-name">{video.user.username}</span>
                <span className="video-stats">{formatViews(video.views)} views • {getDaysAgo(video.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
