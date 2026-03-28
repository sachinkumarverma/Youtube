import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useTranslation } from '../i18n';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoCard from '../components/VideoCard';

export default function VideoList({ endpoint, title }: { endpoint: string, title: string }) {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, language } = useTranslation();

    useEffect(() => {
        const fetchVideos = async () => {
            const cached = sessionStorage.getItem(`videolist_${endpoint}`);
            if (cached) {
                setVideos(JSON.parse(cached));
                setLoading(false);
            } else {
                setLoading(true);
            }
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/${endpoint}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                let data = res.data;
                if (title === 'History' || title === 'Liked Videos') {
                    // Force latest-to-oldest sorting
                    data.sort((a: any, b: any) => new Date(b.viewed_at || b.created_at).getTime() - new Date(a.viewed_at || a.created_at).getTime());
                }
                setVideos(data);
                sessionStorage.setItem(`videolist_${endpoint}`, JSON.stringify(data));
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
            const locale = language === 'hi' ? 'hi-IN' : 'en-US';
            const date = new Date(viewedAt).toLocaleDateString(locale, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const today = new Date().toLocaleDateString(locale, {
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
            <div className="video-grid">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <VideoSkeleton key={i} />)
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '20px', marginBottom: '8px' }}>{t('noVideos')}</p>
                    </div>
                ) : groupedVideos ? (
                    Object.entries(groupedVideos).map(([date, items]) => (
                        <div key={date} style={{ marginBottom: '40px', gridColumn: '1 / -1' }}>
                            <h2 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>{date}</h2>
                            <div className="video-grid">
                                {items.map(video => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))
                )}
            </div>
        </div>
    );
}
