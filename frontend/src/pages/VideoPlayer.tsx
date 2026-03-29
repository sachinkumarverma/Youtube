import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { ThumbsUp, Share2, SkipBack, SkipForward, Clock, UserPlus, UserMinus, User, Flag, Check, MessageSquare, X, MoreVertical, Trash2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ReportModal from '../components/ReportModal';
import VideoCard from '../components/VideoCard';
import { useTranslation } from '../i18n';
import VideoPlayerSkeleton from '../components/VideoPlayerSkeleton';
import AISummaryPanel from '../components/AISummaryPanel';
import { useToast } from '../components/Toast';

interface Comment {
    id: string;
    content: string;
    user_id: string;
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
    const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
    const [reportingCommentId, setReportingCommentId] = useState<string | undefined>(undefined);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const viewedRef = useRef<string | null>(null);

    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (commentMenuId && !(e.target as HTMLElement).closest('[data-comment-menu]')) {
                setCommentMenuId(null);
            }
        };
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, [commentMenuId]);

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
                // Fetch related videos
                axios.get(`${API_BASE_URL}/videos`)
                    .then(res => setRelatedVideos(res.data.filter((v: any) => v.id !== id).slice(0, 12)))
                    .catch(console.error);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
        setShowCommentsModal(false);
    }, [id]);

    const handleLike = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to like!', 'error');
            return;
        }

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
        if (!token) {
            showToast('Please login to save!', 'error');
            return;
        }
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
        if (!token) {
            showToast('Please login to subscribe!', 'error');
            return;
        }
        try {
            const res = await axios.post(`${API_BASE_URL}/user/subscribe/${video.user_id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsSubscribed(res.data.subscribed);
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to subscribe', 'error');
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to comment!', 'error');
            return;
        }

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

    const handleDeleteComment = async (commentId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideo(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== commentId) } : null);
            setCommentMenuId(null);
            showToast('Comment deleted', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to delete comment', 'error');
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

    const previewComments = video.comments?.slice(0, 5) || [];
    const hasMoreComments = (video.comments?.length || 0) > 5;

    const isOwnComment = (comment: Comment) => currentUser?.id === comment.user_id;

    const renderComment = (comment: Comment) => (
        <div key={comment.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                {comment.user.avatar_url ? (
                    <img src={comment.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                        {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{comment.user.username}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '14px' }}>{comment.content}</div>
            </div>
            {currentUser && (
                <div style={{ position: 'relative', flexShrink: 0 }} data-comment-menu>
                    <button
                        onClick={() => setCommentMenuId(commentMenuId === comment.id ? null : comment.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}
                    >
                        <MoreVertical size={16} />
                    </button>
                    {commentMenuId === comment.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', minWidth: '140px', zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                            {isOwnComment(comment) ? (
                                <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setReportingCommentId(comment.id); setShowReportModal(true); setCommentMenuId(null); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                >
                                    <Flag size={14} /> Report
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className={`video-page-layout ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
            {/* Sidebar Toggle Button (Desktop only) */}
            <div className="sidebar-toggle-container">
                <button
                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow)'
                    }}
                    title={isSidebarVisible ? "Hide side panel" : "Show side panel"}
                >
                    {isSidebarVisible ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
            </div>

            {/* Left Column: Video + Info + Comments */}
            <div className="video-page-main">
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                    <video
                        ref={videoRef}
                        src={video.video_url}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>{video.title}</h1>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Link to={`/channel/${video.user_id}`} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'block', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
                                {video.user.avatar_url ? (
                                    <img src={video.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {video.user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <div>
                                <Link to={`/channel/${video.user_id}`} style={{ fontWeight: 'bold', fontSize: '16px', textDecoration: 'none', color: 'inherit', display: 'block' }}>{video.user.username}</Link>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{video.views} {t('views')} • {new Date(video.created_at).toLocaleDateString()}</div>
                            </div>
                            {(!currentUser || currentUser?.id !== video.user_id) && (
                                <button onClick={handleSubscribe} className="subscribe-btn" style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: isSubscribed ? 'var(--bg-hover)' : 'var(--text-primary)', color: isSubscribed ? 'var(--text-primary)' : 'var(--bg-primary)', border: isSubscribed ? '1px solid var(--border)' : 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                    {isSubscribed ? <><UserMinus size={16} /> {t('unsubscribe')}</> : <><UserPlus size={16} /> {t('subscribe')}</>}
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => skipVideo(-2)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                <SkipBack size={18} />
                            </button>
                            <button onClick={() => skipVideo(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                <SkipForward size={18} />
                            </button>
                            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                <ThumbsUp size={18} fill={isLiked ? 'var(--text-primary)' : 'none'} /> {likesCount}
                            </button>
                            <button onClick={handleWatchLater} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: isWatchLater ? 'rgba(62, 166, 255, 0.1)' : 'var(--bg-hover)', color: isWatchLater ? '#3ea6ff' : 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                {isWatchLater ? <Check size={18} /> : <Clock size={18} />}
                            </button>
                            <button onClick={() => setShowShareModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                <Share2 size={18} />
                            </button>
                            <button onClick={() => setShowReportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                <Flag size={18} />
                            </button>
                        </div>
                    </div>

                    <div
                        className="video-description-box"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                        <div className="video-description-header">
                            <span>{video.views.toLocaleString()} {t('views')}</span>
                            <span>{new Date(video.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className={`video-description-content ${!isDescriptionExpanded ? 'collapsed' : ''}`}>
                            {video.description || 'No description provided.'}
                        </div>
                        <button className="show-more-btn">
                            {isDescriptionExpanded ? 'Show less' : '...more'}
                        </button>
                    </div>

                    <AISummaryPanel
                        videoTitle={video.title}
                        videoDescription={video.description}
                        channelName={video.user.username}
                        videoUrl={video.video_url}
                    />
                </div>

                {/* Comments Section */}
                <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{video.comments?.length || 0} {t('comments')}</h2>
                    </div>

                    <form onSubmit={handleComment} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden' }}>
                            {currentUser?.avatar_url ? (
                                <img src={currentUser.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                    {currentUser?.username?.charAt(0).toUpperCase() || <User size={18} />}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                            <input type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', padding: '8px 0', fontSize: '14px' }} />
                            {commentText && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button type="button" onClick={() => setCommentText('')} style={{ padding: '6px 14px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', borderRadius: '20px', fontSize: '13px' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Comment</button>
                                </div>
                            )}
                        </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {previewComments.map(renderComment)}
                    </div>

                    {hasMoreComments && (
                        <button
                            onClick={() => setShowCommentsModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '16px auto 0', padding: '10px 24px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            <MessageSquare size={16} /> Show all {video.comments.length} comments
                        </button>
                    )}
                </div>

                {/* Related Videos - shown here on mobile/tablet only */}
                <div className="video-page-sidebar-mobile">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Related Videos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {relatedVideos.slice(0, 8).map(v => (
                            <VideoCard key={v.id} video={v} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Related Videos (desktop only) */}
            {isSidebarVisible && (
                <div className="video-page-sidebar">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Related Videos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {relatedVideos.map(v => (
                            <VideoCard key={v.id} video={v} />
                        ))}
                    </div>
                </div>
            )}

            {/* Comments Modal */}
            {showCommentsModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowCommentsModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{video.comments.length} {t('comments')}</h2>
                            <button onClick={() => setShowCommentsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {video.comments.map(renderComment)}
                        </div>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                videoId={video.id}
                videoTitle={video.title}
            />

            <ReportModal
                isOpen={showReportModal}
                onClose={() => { setShowReportModal(false); setReportingCommentId(undefined); }}
                videoId={video.id}
                commentId={reportingCommentId}
            />
        </div>
    );
}
