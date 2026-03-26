import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';

const Upload = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const categories = ['Gaming', 'Music', 'Spiritual', 'Entertainment', 'Education', 'Vlogs'];
    const [category, setCategory] = useState(categories[0]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !videoFile || !thumbnailFile) {
            setError('Title, video, and thumbnail are required!');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Calculate video duration
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            const durationPromise = new Promise<string>((resolve) => {
                videoElement.onloadedmetadata = () => {
                    const minutes = Math.floor(videoElement.duration / 60);
                    const seconds = Math.floor(videoElement.duration % 60);
                    resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                };
            });
            videoElement.src = URL.createObjectURL(videoFile);
            const actualDuration = await durationPromise;

            // 1. Upload Video
            const videoExt = videoFile.name.split('.').pop();
            const videoFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${videoExt}`;
            const { error: videoError } = await supabase.storage
                .from('videos')
                .upload(videoFileName, videoFile);

            if (videoError) throw videoError;

            const { data: { publicUrl: videoUrl } } = supabase.storage.from('videos').getPublicUrl(videoFileName);

            // 2. Upload Thumbnail
            const thumbExt = thumbnailFile.name.split('.').pop();
            const thumbFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${thumbExt}`;
            const { error: thumbError } = await supabase.storage
                .from('thumbnails')
                .upload(thumbFileName, thumbnailFile);

            if (thumbError) throw thumbError;

            const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);

            // 3. Save to backend
            const token = localStorage.getItem('token');
            // Fallback: If no token exists, the user should be logged in first.
            // But we will send it anyway, so the backend handles it.

            await axios.post(
                'http://127.0.0.1:5000/api/videos',
                {
                    title,
                    description,
                    video_url: videoUrl,
                    thumbnail_url: thumbnailUrl,
                    category,
                    duration: actualDuration
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <h1>Upload New Video</h1>
            {error && <div style={{ color: '#ff4444', margin: '1rem 0' }}>{error}</div>}

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="title">Title *</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter an awesome title"
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell viewers about your video"
                        rows={5}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="category">Category *</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="videoFile">Video File *</label>
                    <input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="thumbnailFile">Thumbnail File *</label>
                    <input
                        id="thumbnailFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    style={{
                        padding: '1rem',
                        background: uploading ? '#555' : 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        marginTop: '1rem'
                    }}
                >
                    {uploading ? 'Uploading... This might take a while.' : 'Upload Video'}
                </button>
            </form>
        </div>
    );
};

export default Upload;
