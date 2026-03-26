import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

interface Video {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url: string | null;
  duration?: string;
  views: number;
  user: { username: string, avatar_url?: string };
  user_id: string;
  created_at: string;
}

const Home = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5000/api/videos');
        let fetchedVideos = res.data;

        const token = localStorage.getItem('token');
        if (token) {
          try {
            const subRes = await axios.get('http://127.0.0.1:5000/api/user/subscriptions', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const subbedChannelIds = subRes.data.map((s: any) => s.channel_id);
            fetchedVideos.sort((a: any, b: any) => {
              const aSub = subbedChannelIds.includes(a.user_id) ? 1 : 0;
              const bSub = subbedChannelIds.includes(b.user_id) ? 1 : 0;
              if (aSub !== bSub) return bSub - aSub;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          } catch (e) { console.error("Failed to fetch subscriptions for sorting", e); }
        }
        setVideos(fetchedVideos);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVideos();
  }, []);

  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const navigate = useNavigate();

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
  };

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    return days === 0 ? t('today') : `${days} ${t('daysAgo')}`;
  };

  const filteredVideos = videos.filter((v: any) => {
    if (!query || query === 'all') return true;
    return v.title.toLowerCase().includes(query) ||
      (v.description && v.description.toLowerCase().includes(query)) ||
      (v.category && v.category.toLowerCase() === query);
  });

  return (
    <div className="animate-fade-in">
      <div className="categories" style={{ display: 'flex', gap: '12px', padding: '12px 24px', overflowX: 'auto' }}>
        {['All', 'Gaming', 'Music', 'Spiritual', 'Entertainment', 'Education', 'Vlogs'].map(cat => (
          <button
            key={cat}
            onClick={() => navigate(`/?q=${cat === 'All' ? '' : cat.toLowerCase()}`)}
            className={`category-pill ${query === cat.toLowerCase() || (!query && cat === 'All') ? 'active' : ''}`}
          >
            {t(cat.toLowerCase() as any)}
          </button>
        ))}
      </div>

      <div className="video-grid">
        {filteredVideos.map((video: any) => (
          <div key={video.id} className="video-card-container">
            <Link to={`/video/${video.id}`} className="video-card" style={{ textDecoration: 'none' }}>
              <div className="thumbnail-wrapper">
                <img src={video.thumbnail_url || 'https://via.placeholder.com/400x225'} alt={video.title} className="thumbnail-img" />
                <span className="video-duration">{video.duration || '4:20'}</span>
              </div>
            </Link>
            <div className="video-card-info" style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
              <Link to={`/channel/${video.user_id}`} className="avatar" style={{ overflow: 'hidden', background: video.user.avatar_url ? 'transparent' : '', cursor: 'pointer', textDecoration: 'none', color: 'inherit', width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}>
                {video.user.avatar_url ? (
                  <img src={video.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', fontWeight: 'bold' }}>
                    {video.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="video-details" style={{ flex: 1 }}>
                <Link to={`/video/${video.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 className="video-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', lineBreak: 'anywhere' }}>{video.title}</h3>
                </Link>
                <Link to={`/channel/${video.user_id}`} className="channel-name" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'block', fontSize: '14px', marginTop: '4px' }}>{video.user.username}</Link>
                <span className="video-stats" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{formatViews(video.views)} {t('views')} • {getDaysAgo(video.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
