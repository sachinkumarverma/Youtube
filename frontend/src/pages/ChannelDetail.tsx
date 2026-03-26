import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Info, PlayCircle, Edit3, Camera, X, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../constants';

interface ChannelData {
    user: {
        id: string;
        username: string;
        avatar_url: string | null;
        banner_url: string | null;
        about: string | null;
        created_at: string;
        username_updated_at: string | null;
        _count: { subscribers: number, videos: number };
    };
    videos: any[];
    totalViews: number;
}

export default function ChannelDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<ChannelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos');
    const { t } = useTranslation();
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    // Profile Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editAbout, setEditAbout] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Video Edit & Delete State
    const [isVideoEditModalOpen, setIsVideoEditModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<any>(null);
    const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchChannel = async () => {
            if (!id) return;
            try {
                const res = await axios.get(`http://127.0.0.1:5000/api/user/channel/${id}`);
                setData(res.data);
                setEditUsername(res.data.user.username);
                setEditAbout(res.data.user.about || '');
                setAvatarPreview(res.data.user.avatar_url);
                setBannerPreview(res.data.user.banner_url);

                const token = localStorage.getItem('token');
                if (token) {
                    const subsRes = await axios.get('http://127.0.0.1:5000/api/user/subscriptions', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setIsSubscribed(subsRes.data.some((s: any) => s.channel_id === id));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChannel();
    }, [id]);

    const handleSubscribe = async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to subscribe!');
        try {
            const res = await axios.post(`http://127.0.0.1:5000/api/user/subscribe/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsSubscribed(res.data.subscribed);
            if (data) {
                setData({
                    ...data,
                    user: {
                        ...data.user,
                        _count: {
                            ...data.user._count,
                            subscribers: res.data.subscribed ? data.user._count.subscribers + 1 : data.user._count.subscribers - 1
                        }
                    }
                });
            }
        } catch (err) { console.error(err); }
    };

    const handleProfileUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            let avatar_url = avatarPreview;
            let banner_url = bannerPreview;

            if (avatarFile) {
                const fileName = `avatar_${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatar_url = urlData.publicUrl;
            }

            if (bannerFile) {
                const fileName = `banner_${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, bannerFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
                banner_url = urlData.publicUrl;
            }

            setSaving(true);
            const res = await axios.put('http://127.0.0.1:5000/api/auth/profile', {
                username: editUsername,
                about: editAbout,
                avatar_url,
                banner_url
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(prev => prev ? { ...prev, user: { ...prev.user, ...res.data } } : null);
            localStorage.setItem('user', JSON.stringify(res.data));
            setIsEditModalOpen(false);
            // Dispatch event to notify other components (like Navbar) of localStorage update
            window.dispatchEvent(new Event('storage'));
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteVideo = async () => {
        if (!deleteVideoId) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://127.0.0.1:5000/api/videos/${deleteVideoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(prev => prev ? { ...prev, videos: prev.videos.filter(v => v.id !== deleteVideoId) } : null);
            setDeleteVideoId(null);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Channel not found.</div>;

    const { user, videos, totalViews } = data;
    const isOwner = currentUser?.id === user.id;

    // Constraints & Change tracking
    const lastUpdated = user.username_updated_at;
    const daysSinceUpdate = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)) : 31;


    const isUsernameModified = editUsername !== user.username;
    const isAboutModified = editAbout.trim() !== (user.about || '').trim();
    const isAvatarModified = !!avatarFile;
    const isBannerModified = !!bannerFile;

    const isSomethingModified = isUsernameModified || isAboutModified || isAvatarModified || isBannerModified;
    // For first-time change, if lastUpdated is null, daysSinceUpdate is 31, avoiding the block.
    const isUsernameBlocked = isUsernameModified && daysSinceUpdate < 30;
    const isSaveDisabled = saving || !isSomethingModified || isUsernameBlocked;

    console.log('Username Cooldown Stats:', {
        editUsername,
        currentUsername: user.username,
        lastUpdated,
        daysSinceUpdate,
        isUsernameBlocked,
        isSomethingModified,
        isSaveDisabled
    });


    return (
        <div style={{ padding: '0 0 40px 0', color: 'var(--text-primary)' }}>
            {/* Banner */}
            <div style={{ height: '200px', width: '100%', position: 'relative', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                {user.banner_url ? (
                    <img src={user.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #2d2d31, #1a1a1d)' }}></div>
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '-40px', paddingBottom: '24px', position: 'relative' }}>
                    <div style={{ width: '128px', height: '128px', borderRadius: '50%', border: '4px solid var(--bg-primary)', overflow: 'hidden', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '48px', fontWeight: 'bold' }}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '50px', flex: 1 }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {user.username} <CheckCircle2 size={24} color="var(--text-secondary)" />
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '15px' }}>
                            @{user.username.toLowerCase().replace(' ', '')} • {user._count.subscribers} {t('subscribers')} • {user._count.videos} {t('videos')}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            {isOwner ? (
                                <button onClick={() => {
                                    setEditUsername(user.username);
                                    setEditAbout(user.about || '');
                                    setAvatarPreview(user.avatar_url);
                                    setBannerPreview(user.banner_url);
                                    setAvatarFile(null);
                                    setBannerFile(null);
                                    setIsEditModalOpen(true);
                                }} style={{ padding: '10px 24px', borderRadius: '24px', border: 'none', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Edit3 size={18} /> {t('customizeChannel')}
                                </button>
                            ) : (
                                <button onClick={handleSubscribe} style={{ padding: '10px 24px', borderRadius: '24px', border: 'none', background: isSubscribed ? 'var(--bg-hover)' : 'var(--text-primary)', color: isSubscribed ? 'var(--text-primary)' : 'var(--bg-primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {isSubscribed ? t('unsubscribe') : t('subscribe')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
                    <button onClick={() => setActiveTab('videos')} style={{ padding: '12px 4px', background: 'transparent', border: 'none', color: activeTab === 'videos' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'videos' ? '2px solid var(--text-primary)' : 'none' }}>
                        {t('videos').toUpperCase()}
                    </button>
                    <button onClick={() => setActiveTab('about')} style={{ padding: '12px 4px', background: 'transparent', border: 'none', color: activeTab === 'about' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'about' ? '2px solid var(--text-primary)' : 'none' }}>
                        {t('about').toUpperCase()}
                    </button>
                </div>

                {activeTab === 'videos' ? (
                    <div className="video-grid">
                        {videos.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                {t('noVideos')}
                            </div>
                        ) : (
                            videos.map(video => (
                                <div key={video.id} style={{ position: 'relative' }}>
                                    <Link to={`/video/${video.id}`} className="video-card" style={{ textDecoration: 'none' }}>
                                        <div className="thumbnail-wrapper">
                                            <img src={video.thumbnail_url || 'https://via.placeholder.com/400x225'} alt={video.title} className="thumbnail-img" />
                                            <span className="video-duration">{video.duration || '4:20'}</span>
                                        </div>
                                        <div className="video-details" style={{ marginTop: '12px' }}>
                                            <h3 className="video-title">{video.title}</h3>
                                            <p className="video-stats">{video.views} {t('views')} • {new Date(video.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </Link>
                                    {isOwner && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button onClick={() => { setEditingVideo(video); setIsVideoEditModalOpen(true); }} style={{ flex: 1, padding: '6px', background: 'var(--bg-hover)', border: 'none', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{t('edit')}</button>
                                            <button onClick={() => setDeleteVideoId(video.id)} style={{ flex: 1, padding: '6px', background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{t('delete')}</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ maxWidth: '800px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>{t('description')}</h3>
                            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                {user.about || "No description provided."}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontSize: '18px' }}>Stats</h3>
                            <div style={{ height: '1px', background: 'var(--border)' }}></div>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Info size={18} /> Joined {new Date(user.created_at).toLocaleDateString()}</p>
                            <div style={{ height: '1px', background: 'var(--border)' }}></div>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><PlayCircle size={18} /> {totalViews} {t('views')}</p>
                            <div style={{ height: '1px', background: 'var(--border)' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Customization Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="modal-content" style={{
                        background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px',
                        width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px' }}>{t('customizeChannel')}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Banner Edit */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('bannerImage')}</label>
                                <div style={{ height: '120px', background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                    {bannerPreview && <img src={bannerPreview} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    <label style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                        <Camera size={20} color="white" />
                                        <input type="file" hidden accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setBannerFile(file);
                                                setBannerPreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                    </label>
                                </div>
                            </div>

                            {/* Avatar Edit */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '32px' }}>{editUsername.charAt(0)}</div>
                                    )}
                                    <label style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', opacity: 0, transition: '0.2s', cursor: 'pointer' }} className="hover-opacity">
                                        <Camera size={24} color="white" />
                                        <input type="file" hidden accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAvatarFile(file);
                                                setAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                    </label>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('username')}</label>
                                    <input
                                        value={editUsername}
                                        onChange={e => setEditUsername(e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px', background: 'var(--bg-secondary)',
                                            border: isUsernameBlocked ? '2px solid #ff4444' : '1px solid var(--border)',
                                            borderRadius: '8px', color: 'var(--text-primary)',
                                            transition: 'border-color 0.2s',
                                            outline: 'none'
                                        }}
                                        placeholder="Username"
                                    />
                                    {isUsernameBlocked && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: '#ff4444', fontSize: '14px', fontWeight: 'bold', background: 'rgba(255, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                                            <AlertCircle size={20} />
                                            <span>{t('usernameCooldown' as any)} ({30 - daysSinceUpdate} {t('daysRemaining' as any)})</span>
                                        </div>
                                    )}
                                    {(daysSinceUpdate < 30 && !isUsernameBlocked) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', color: 'var(--text-secondary)', fontSize: '13px', padding: '0 4px' }}>
                                            <Info size={16} /> {t('waitDays' as any)} {30 - daysSinceUpdate} {t('daysRemaining' as any)}.
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* About Edit */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('aboutMe')}</label>
                                <textarea
                                    value={editAbout}
                                    onChange={e => setEditAbout(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', minHeight: '120px', resize: 'vertical' }}
                                    placeholder={t('bio')}
                                />
                            </div>

                            <button
                                onClick={handleProfileUpdate}
                                disabled={isSaveDisabled}
                                className="save-btn"
                                style={{
                                    padding: '14px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
                                    border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px',
                                    cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isSaveDisabled ? 0.6 : 1,
                                    transition: 'all 0.1s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: isSaveDisabled ? 'none' : '0 4px 15px rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                {saving ? <><div className="spinner"></div> Saving...</> : t('saveChanges')}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteVideoId && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div className="modal-content" style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,0,0,0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
                            <X size={32} color="#ff4444" />
                        </div>
                        <h2 style={{ marginBottom: '12px' }}>{t('confirmDelete')}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This action cannot be undone. This video will be permanently removed.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={confirmDeleteVideo} style={{ flex: 1, padding: '12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{t('delete')}</button>
                            <button onClick={() => setDeleteVideoId(null)} style={{ flex: 1, padding: '12px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{t('cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Edit Modal */}
            {isVideoEditModalOpen && (
                <VideoEditModal
                    video={editingVideo}
                    onClose={() => setIsVideoEditModalOpen(false)}
                    onUpdate={(updated) => {
                        setData(prev => prev ? {
                            ...prev,
                            videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                        } : null);
                        setIsVideoEditModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

// Inner Component for Video Editing
function VideoEditModal({ video, onClose, onUpdate }: { video: any, onClose: () => void, onUpdate: (v: any) => void }) {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description || '');
    const [category, setCategory] = useState(video.category || 'All');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(video.thumbnail_url);
    const { t } = useTranslation();

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

        try {
            const res = await axios.put(`http://127.0.0.1:5000/api/videos/${video.id}`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            onUpdate(res.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '500px' }}>
                <h2 style={{ marginBottom: '24px' }}>{t('edit')} {t('videos')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ height: '150px', background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={thumbnailPreview || 'https://via.placeholder.com/400x225'} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#3ea6ff' }}>
                        <Camera size={18} /> Change Thumbnail
                        <input type="file" hidden accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setThumbnailFile(file);
                                setThumbnailPreview(URL.createObjectURL(file));
                            }
                        }} />
                    </label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" style={{ padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', minHeight: '100px' }} />
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                        {['All', ...CATEGORIES].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{t('saveChanges')}</button>
                        <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{t('cancel')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
