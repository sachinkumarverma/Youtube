import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoCard from '../components/VideoCard';

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
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchVideos = async () => {
      const cached = sessionStorage.getItem('home_videos');
      if (cached) {
        setVideos(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }

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
        sessionStorage.setItem('home_videos', JSON.stringify(fetchedVideos));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const navigate = useNavigate();

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
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => <VideoSkeleton key={i} />)
        ) : filteredVideos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            <p>{t('noVideos')}</p>
          </div>
        ) : (
          filteredVideos.map((video: any) => (
            <VideoCard key={video.id} video={video} />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
