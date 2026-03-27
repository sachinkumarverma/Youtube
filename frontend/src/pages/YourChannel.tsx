import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Upload } from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from '../i18n';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoCard from '../components/VideoCard';

export default function YourChannel() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVideo, setEditingVideo] = useState<any>(null);
    const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editThumbnail, setEditThumbnail] = useState<string | null>(null);
    const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);

    const { t } = useTranslation();

    const fetchVideos = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/user/channel`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const openEditModal = (video: any) => {
        setEditingVideo(video);
        setEditTitle(video.title);
        setEditDesc(video.description || '');
        setEditCategory(video.category || '');
        setEditThumbnail(video.thumbnail_url);
        setNewThumbnailFile(null);
    };

    const handleUpdate = async () => {
        if (!editingVideo) return;
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('description', editDesc);
            formData.append('category', editCategory);
            if (newThumbnailFile) {
                formData.append('thumbnail', newThumbnailFile);
            }

            await axios.put(`http://127.0.0.1:5000/api/videos/${editingVideo.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setEditingVideo(null);
            fetchVideos();
        } catch (err) {
            alert('Failed to edit video');
        }
    };

    const confirmDelete = async () => {
        if (!deletingVideoId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://127.0.0.1:5000/api/videos/${deletingVideoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeletingVideoId(null);
            fetchVideos();
        } catch (err) {
            alert('Failed to delete video');
        }
    };

    return (
        <div style={{ padding: '24px', color: 'var(--text-primary)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>{t('yourChannel')}</h1>
            <div className="video-grid">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <VideoSkeleton key={i} />)
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '20px', marginBottom: '8px' }}>{t('noVideos')}</p>
                    </div>
                ) : (
                    videos.map(video => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            isOwner={true}
                            onEdit={() => openEditModal(video)}
                            onDelete={() => setDeletingVideoId(video.id)}
                        />
                    ))
                )}
            </div>

            <Modal isOpen={!!editingVideo} onClose={() => setEditingVideo(null)} title={t('edit')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t('upload')} Thumbnail</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                            <div style={{ width: '160px', height: '90px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                                <img src={newThumbnailFile ? URL.createObjectURL(newThumbnailFile) : (editThumbnail || 'https://via.placeholder.com/160x90')} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <label style={{ padding: '8px 16px', background: 'var(--bg-hover)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                <Upload size={16} /> Choose File
                                <input type="file" accept="image/*" hidden onChange={e => setNewThumbnailFile(e.target.files?.[0] || null)} />
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Title</label>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t('description')}</label>
                        <textarea rows={4} value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t('category')}</label>
                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                            {['Music', 'Gaming', 'Spiritual', 'Entertainment', 'Education', 'Vlogs'].map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                        </select>
                    </div>
                    <button onClick={handleUpdate} style={{ padding: '12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '12px' }}>{t('saveChanges')}</button>
                </div>
            </Modal>

            <Modal isOpen={!!deletingVideoId} onClose={() => setDeletingVideoId(null)} title={t('delete')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', display: 'grid', placeItems: 'center' }}>
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 style={{ marginBottom: '8px' }}>Delete Video?</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('confirmDelete')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button onClick={() => setDeletingVideoId(null)} style={{ flex: 1, padding: '12px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{t('cancel')}</button>
                        <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{t('delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
