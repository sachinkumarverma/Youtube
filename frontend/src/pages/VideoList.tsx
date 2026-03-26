import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';

export default function VideoList({ endpoint, title }: { endpoint: string, title: string }) {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://127.0.0.1:5000/api/${endpoint}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setVideos(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, [endpoint]);

    const groupVideosByDate = (videoList: any[]) => {
        const groups: { [key: string]: any[] } = {};
        videoList.forEach(video => {
            const viewedAt = video.viewed_at || video.created_at;
            const date = new Date(viewedAt).toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const today = new Date().toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const displayDate = date === today ? t('today') : date;

            if (!groups[displayDate]) groups[displayDate] = [];
            groups[displayDate].push(video);
        });
        return groups;
    };

    const groupedVideos = (title === 'History' || title === 'Liked Videos') ? groupVideosByDate(videos) : null;

    // Translate the title key if possible
    const translatedTitle = t(title.toLowerCase().replace(' ', '') as any) || title;

    return (
        <div style={{ padding: '24px', color: 'var(--text-primary)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>{translatedTitle}</h1>
            {loading ? (
                <p>Loading...</p>
            ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '20px', marginBottom: '8px' }}>{t('noVideos')}</p>
                </div>
            ) : groupedVideos ? (
                Object.entries(groupedVideos).map(([date, items]) => (
                    <div key={date} style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>{date}</h2>
                        <div className="video-grid">
                            {items.map(video => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="video-grid">
                    {videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
}

function VideoCard({ video }: { video: any }) {
    const { t } = useTranslation();
    return (
        <Link to={`/video/${video.id}`} className="video-card" style={{ textDecoration: 'none' }}>
            <div className="thumbnail-wrapper">
                <img src={video.thumbnail_url || 'https://via.placeholder.com/400x225'} alt={video.title} className="thumbnail-img" />
                <span className="video-duration">{video.duration || '4:20'}</span>
            </div>
            <div className="video-card-info">
                <div className="avatar" style={{ overflow: 'hidden', background: video.user?.avatar_url ? 'transparent' : '' }}>
                    {video.user?.avatar_url ? (
                        <img src={video.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        video.user?.username?.charAt(0).toUpperCase() || 'U'
                    )}
                </div>
                <div className="video-details">
                    <h3 className="video-title">{video.title}</h3>
                    <p className="video-channel">{video.user?.username}</p>
                    <p className="video-stats">{video.views} {t('views')} • {new Date(video.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        </Link>
    );
}
