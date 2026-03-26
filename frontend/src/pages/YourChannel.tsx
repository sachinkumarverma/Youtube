import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, AlertTriangle, Upload, MoreVertical } from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from '../i18n';
import { formatDuration } from '../utils/format';

export default function YourChannel() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVideo, setEditingVideo] = useState<any>(null);
    const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openEditModal = (video: any) => {
        setOpenMenuId(null);
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
            {loading ? (
                <p>Loading...</p>
            ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '20px', marginBottom: '8px' }}>{t('noVideos')}</p>
                </div>
            ) : (
                <div className="video-grid">
                    {videos.map(video => (
                        <div key={video.id} style={{ position: 'relative' }}>
                            <Link to={`/video/${video.id}`} className="video-card" style={{ textDecoration: 'none', marginBottom: 0 }}>
                                <div className="thumbnail-wrapper">
                                    <img src={video.thumbnail_url || 'https://via.placeholder.com/400x225'} alt={video.title} className="thumbnail-img" />
                                    <span className="video-duration">{formatDuration(video.duration)}</span>
                                </div>
                                <div className="video-card-info" style={{ padding: '12px 0 0 0' }}>
                                    <div className="video-details" style={{ marginLeft: 0, paddingRight: '32px' }}>
                                        <h3 className="video-title">{video.title}</h3>
                                        <p className="video-stats">{video.views} {t('views')} • {video.category || 'No Category'}</p>
                                    </div>
                                </div>
                            </Link>

                            {/* 3-dot menu */}
                            <div style={{ position: 'absolute', top: '55%', right: '4px' }} ref={openMenuId === video.id ? menuRef : null}>
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === video.id ? null : video.id); }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    className="hover-bg"
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {openMenuId === video.id && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: '100%', zIndex: 100,
                                        background: 'var(--bg-secondary)', borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: '160px',
                                        overflow: 'hidden', border: '1px solid var(--border)',
                                        animation: 'fadeIn 0.15s ease'
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(video); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                                padding: '10px 16px', background: 'transparent', border: 'none',
                                                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px',
                                                transition: 'background 0.15s'
                                            }}
                                            className="hover-bg"
                                        >
                                            <Pencil size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setDeletingVideoId(video.id); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                                padding: '10px 16px', background: 'transparent', border: 'none',
                                                color: '#ff4444', cursor: 'pointer', fontSize: '14px',
                                                transition: 'background 0.15s'
                                            }}
                                            className="hover-bg"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
