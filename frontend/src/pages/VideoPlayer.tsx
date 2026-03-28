import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { ThumbsUp, Share2, SkipBack, SkipForward, Clock, UserPlus, UserMinus, User, Flag, Check } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ReportModal from '../components/ReportModal';
import { useTranslation } from '../i18n';
import VideoPlayerSkeleton from '../components/VideoPlayerSkeleton';
import AISummaryPanel from '../components/AISummaryPanel';

interface Comment {
    id: string;
    content: string;
    user: { username: string, avatar_url: string | null };
    created_at: string;
}

interface Video {
    id: string;
    title: string;
    description: string;
    video_url: string;
    views: number;
    user_id: string;
    user: { id: string; username: string; avatar_url: string | null };
    created_at: string;
    comments: Comment[];
    likes: { id: string; user_id: string }[];
}

export default function VideoPlayer() {
    const { id } = useParams<{ id: string }>();
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isWatchLater, setIsWatchLater] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const viewedRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchVideo = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/videos/${id}`);
                setVideo(response.data);
                setLikesCount(response.data.likes.length);

                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const u = JSON.parse(userStr);
                    setCurrentUser(u);
                    setIsLiked(response.data.likes.some((l: any) => l.user_id === u.id));

                    const token = localStorage.getItem('token');
                    if (token) {
                        axios.post(`${API_BASE_URL}/user/history/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

                        axios.get(`${API_BASE_URL}/user/watch-later`, { headers: { Authorization: `Bearer ${token}` } })
                            .then(res => setIsWatchLater(res.data.some((v: any) => v.id === id)));

                        axios.get(`${API_BASE_URL}/user/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
                            .then(res => setIsSubscribed(res.data.some((s: any) => s.channel_id === response.data.user_id)));
                    }
                }

                if (viewedRef.current !== id) {
                    viewedRef.current = id || null; // Synchronously mark as viewed to prevent double-firing in StrictMode
                    const token = localStorage.getItem('token');
                    if (token) {
                        axios.put(`${API_BASE_URL}/videos/${id}/view`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(console.error);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id]);

    const handleLike = async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to like!');

        // Optimistic update using current state
        const willBeLiked = !isLiked;
        setIsLiked(willBeLiked);
        setLikesCount(prev => willBeLiked ? prev + 1 : Math.max(0, prev - 1));

        try {
            const res = await axios.post(`${API_BASE_URL}/videos/${id}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Sync with server truth
            setIsLiked(res.data.liked);
            if (res.data.liked !== willBeLiked) {
                // Server disagreed — revert the count change and apply correct one
                setLikesCount(prev => res.data.liked
                    ? prev + (willBeLiked ? 0 : 1)
                    : Math.max(0, prev - (willBeLiked ? 1 : 0))
                );
            }
        } catch (err) {
            // Revert on error
            setIsLiked(!willBeLiked);
            setLikesCount(prev => willBeLiked ? Math.max(0, prev - 1) : prev + 1);
            console.error(err);
        }
    };

    const handleWatchLater = async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to save!');
        try {
            const res = await axios.post(`${API_BASE_URL}/user/watch-later/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsWatchLater(res.data.watchLater);
        } catch (err) { console.error(err); }
    };

    const handleSubscribe = async () => {
        if (!video) return;
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to subscribe!');
        try {
            const res = await axios.post(`${API_BASE_URL}/user/subscribe/${video.user_id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsSubscribed(res.data.subscribed);
        } catch (err: any) { alert(err.response?.data?.error || 'Failed to subscribe'); }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to comment!');

        try {
            const res = await axios.post(`${API_BASE_URL}/videos/${id}/comment`, { content: commentText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideo(prev => prev ? { ...prev, comments: [res.data, ...prev.comments] } : null);
            setCommentText('');
        } catch (err) {
            console.error(err);
        }
    };

    const skipVideo = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    if (loading) return <VideoPlayerSkeleton />;

    if (!video) return (
        <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Video not found</h2>
            <p>The video you're looking for might have been removed or doesn't exist.</p>
            <Link to="/" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', background: 'var(--accent)', color: '#fff', borderRadius: '24px', fontWeight: 'bold', textDecoration: 'none' }}>Go Home</Link>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                <video
                    ref={videoRef}
                    src={video.video_url}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', outline: 'none' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{video.title}</h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Link to={`/channel/${video.user_id}`} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'block', textDecoration: 'none', color: 'inherit' }}>
                            {video.user.avatar_url ? (
                                <img src={video.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                                    {video.user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <div>
                            <Link to={`/channel/${video.user_id}`} style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'none', color: 'inherit', display: 'block' }}>{video.user.username}</Link>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{video.views} {t('views')} • {new Date(video.created_at).toLocaleDateString()}</div>
                        </div>
                        {(!currentUser || currentUser?.id !== video.user_id) && (
                            <button onClick={handleSubscribe} className="subscribe-btn" style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: isSubscribed ? 'var(--bg-hover)' : 'var(--text-primary)', color: isSubscribed ? 'var(--text-primary)' : 'var(--bg-primary)', border: isSubscribed ? '1px solid var(--border)' : 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>
                                {isSubscribed ? <><UserMinus size={18} /> {t('unsubscribe')}</> : <><UserPlus size={18} /> {t('subscribe')}</>}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => skipVideo(-2)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <SkipBack size={20} />
                        </button>
                        <button onClick={() => skipVideo(2)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <SkipForward size={20} />
                        </button>
                        <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <ThumbsUp size={20} fill={isLiked ? 'var(--text-primary)' : 'none'} /> {likesCount}
                        </button>
                        <button onClick={handleWatchLater} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: isWatchLater ? 'rgba(62, 166, 255, 0.1)' : 'var(--bg-hover)', color: isWatchLater ? '#3ea6ff' : 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isWatchLater ? <Check size={20} /> : <Clock size={20} />} {isWatchLater ? 'Saved' : t('watchLater')}
                        </button>
                        <button onClick={() => setShowShareModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Share2 size={20} /> {t('share')}
                        </button>
                        <button onClick={() => setShowReportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Flag size={20} /> Report
                        </button>
                    </div>
                </div>

                {video.description && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {video.description}
                    </div>
                )}

                {/* ── AI Features Section ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                    <AISummaryPanel
                        videoTitle={video.title}
                        videoDescription={video.description}
                        channelName={video.user.username}
                    />
                </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{video.comments?.length || 0} Comments</h2>

                <form onSubmit={handleComment} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden' }}>
                        {currentUser?.avatar_url ? (
                            <img src={currentUser.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                                {currentUser?.username?.charAt(0).toUpperCase() || <User size={20} />}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                        <input type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', padding: '8px 0', fontSize: '15px' }} />
                        {commentText && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button type="button" onClick={() => setCommentText('')} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', borderRadius: '20px' }}>Cancel</button>
                                <button type="submit" style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Comment</button>
                            </div>
                        )}
                    </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {video.comments?.map(comment => (
                        <div key={comment.id} style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                                {comment.user.avatar_url ? (
                                    <img src={comment.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                                        {comment.user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{comment.user.username}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: '15px' }}>{comment.content}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                videoId={video.id}
                videoTitle={video.title}
            />

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                videoId={video.id}
            />
        </div>
    );
}
