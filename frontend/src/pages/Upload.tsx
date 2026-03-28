import { useState, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import { Upload as UploadIcon, Image, X, CheckCircle2 } from 'lucide-react';
import { formatDuration } from '../utils/format';
import AIThumbnailGenerator from '../components/AIThumbnailGenerator';
import { useTranslation } from '../i18n';

type UploadStep = 'select' | 'details' | 'uploading' | 'done';

const Upload = () => {
    const [step, setStep] = useState<UploadStep>('select');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState('0:00');
    const categories = ['Gaming', 'Music', 'Spiritual', 'Entertainment', 'Education', 'Vlogs'];
    const [category, setCategory] = useState(categories[0]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const processVideoFile = useCallback((file: File) => {
        setVideoFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));

        // Generate video preview & extract duration
        const url = URL.createObjectURL(file);
        setVideoPreview(url);

        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
            setVideoDuration(videoElement.duration.toString());
        };
        videoElement.src = url;

        setStep('details');
        setError('');
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            processVideoFile(file);
        } else {
            setError('Please drop a valid video file.');
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processVideoFile(file);
        }
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !videoFile) {
            setError('Title and video are required!');
            return;
        }

        setUploading(true);
        setStep('uploading');
        setError('');

        try {
            // Simulate progress phases
            setUploadProgress(5);

            // 1. Upload Video
            const videoExt = videoFile.name.split('.').pop();
            const videoFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${videoExt}`;

            setUploadProgress(10);
            const { error: videoError } = await supabase.storage
                .from('videos')
                .upload(videoFileName, videoFile);

            if (videoError) throw videoError;
            setUploadProgress(60);

            const { data: { publicUrl: videoUrl } } = supabase.storage.from('videos').getPublicUrl(videoFileName);

            // 2. Upload Thumbnail (if provided)
            let thumbnailUrl = '';
            if (thumbnailFile) {
                const thumbExt = thumbnailFile.name.split('.').pop();
                const thumbFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${thumbExt}`;
                const { error: thumbError } = await supabase.storage
                    .from('thumbnails')
                    .upload(thumbFileName, thumbnailFile);
                if (thumbError) throw thumbError;
                const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);
                thumbnailUrl = publicUrl;
            }
            setUploadProgress(80);

            // 3. Save to backend
            await axios.post(
                'http://127.0.0.1:5000/api/videos',
                {
                    title,
                    description,
                    video_url: videoUrl,
                    thumbnail_url: thumbnailUrl || null,
                    category,
                    duration: videoDuration
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setUploadProgress(100);
            setStep('done');

            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during upload.');
            setStep('details');
        } finally {
            setUploading(false);
        }
    };

    // ─── Step 1: Select Video (YouTube-style) ─────────────
    if (step === 'select') {
        return (
            <div style={{ padding: '40px 24px', maxWidth: '960px', margin: '0 auto', color: 'var(--text-primary)', position: 'relative' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ position: 'absolute', top: '40px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={24} />
                </button>
                <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Upload video</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
                    Your videos will be private until you publish them.
                </p>

                {error && <div style={{ color: '#ff4444', margin: '0 0 16px 0', padding: '12px', background: 'rgba(255,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}

                <div
                    ref={dragRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${isDragOver ? '#3ea6ff' : 'var(--border)'}`,
                        borderRadius: '16px',
                        padding: '80px 40px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isDragOver ? 'rgba(62, 166, 255, 0.05)' : 'var(--bg-secondary)',
                        transition: 'all 0.3s ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
                    }}
                >
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'rgba(62, 166, 255, 0.1)', display: 'grid', placeItems: 'center'
                    }}>
                        <UploadIcon size={48} color="#3ea6ff" />
                    </div>
                    <div>
                        <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            Drag and drop video files to upload
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Your videos will be private until you publish them.
                        </p>
                    </div>
                    <button
                        type="button"
                        style={{
                            padding: '12px 32px', background: '#3ea6ff', color: '#000',
                            border: 'none', borderRadius: '24px', fontWeight: 'bold',
                            fontSize: '16px', cursor: 'pointer', letterSpacing: '0.5px'
                        }}
                    >
                        SELECT FILES
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={handleVideoSelect}
                />
            </div>
        );
    }

    // ─── Step 2: Fill Details ──────────────────────────────
    if (step === 'details') {
        return (
            <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>
                        {title || 'Untitled Video'}
                    </h1>
                    <button
                        onClick={() => { setStep('select'); setVideoFile(null); setVideoPreview(null); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {error && <div style={{ color: '#ff4444', margin: '0 0 16px 0', padding: '12px', background: 'rgba(255,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
                    {/* Left: Details Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px' }}>Details</label>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Title */}
                                <div style={{ position: 'relative' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        {t('titleReq' as any)}
                                    </label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t('titleReq' as any)}
                                        required
                                        maxLength={100}
                                        style={{
                                            width: '100%', padding: '12px', background: 'var(--bg-primary)',
                                            border: '1px solid var(--border)', borderRadius: '8px',
                                            color: 'var(--text-primary)', fontSize: '15px', outline: 'none'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {title.length}/100
                                    </span>
                                </div>

                                {/* Description */}
                                <div style={{ position: 'relative' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        {t('description')}
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('videoDescPlaceholder' as any)}
                                        rows={6}
                                        maxLength={5000}
                                        style={{
                                            width: '100%', padding: '12px', background: 'var(--bg-primary)',
                                            border: '1px solid var(--border)', borderRadius: '8px',
                                            color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                                            resize: 'vertical', minHeight: '120px'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {description.length}/5000
                                    </span>
                                </div>

                                {/* Category */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        {t('category')}
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px', background: 'var(--bg-primary)',
                                            border: '1px solid var(--border)', borderRadius: '8px',
                                            color: 'var(--text-primary)', fontSize: '15px', outline: 'none'
                                        }}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase() as any) || cat}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px' }}>Thumbnail</label>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                                {t('uploadThumbDesc' as any)}
                            </p>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <label style={{
                                    width: '180px', height: '100px', borderRadius: '8px',
                                    border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                                    cursor: 'pointer', background: 'var(--bg-secondary)',
                                    transition: 'border-color 0.2s', fontSize: '13px', color: 'var(--text-secondary)'
                                }}>
                                    <Image size={24} />
                                    {t('uploadThumbnail' as any)}
                                    <input type="file" hidden accept="image/*" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setThumbnailFile(file);
                                            setThumbnailPreview(URL.createObjectURL(file));
                                        }
                                    }} />
                                </label>
                                {thumbnailPreview && (
                                    <div style={{ position: 'relative', width: '180px', height: '100px', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={thumbnailPreview} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                            style={{
                                                position: 'absolute', top: '4px', right: '4px',
                                                background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                                                width: '24px', height: '24px', display: 'grid', placeItems: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={14} color="white" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* AI Thumbnail Generator */}
                            <AIThumbnailGenerator
                                videoTitle={title || 'My Video'}
                                videoCategory={category}
                                onSelectThumbnail={(blob, previewUrl) => {
                                    const file = new File([blob], `ai_thumbnail_${Date.now()}.jpg`, { type: 'image/jpeg' });
                                    setThumbnailFile(file);
                                    setThumbnailPreview(previewUrl);
                                }}
                            />
                        </div>

                        {/* Submit */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                            <button
                                type="submit"
                                disabled={!title || uploading}
                                style={{
                                    padding: '12px 40px', background: (!title || uploading) ? 'var(--bg-hover)' : '#3ea6ff',
                                    color: (!title || uploading) ? 'var(--text-secondary)' : '#000',
                                    border: 'none', borderRadius: '24px', fontWeight: 'bold',
                                    fontSize: '16px', cursor: (!title || uploading) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Publish
                            </button>
                        </div>
                    </div>

                    {/* Right: Video Preview Card */}
                    <div style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
                        <div style={{
                            background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden'
                        }}>
                            {videoPreview && (
                                <video
                                    src={videoPreview}
                                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', background: '#000' }}
                                    muted
                                />
                            )}
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('videoLink' as any)}</span>
                                    <span style={{ fontSize: '13px', color: '#3ea6ff' }}>viewtube.com</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('fileName' as any)}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {videoFile?.name}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('duration' as any)}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatDuration(videoDuration)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    // ─── Step 3: Uploading ────────────────────────────────
    if (step === 'uploading') {
        return (
            <div style={{
                padding: '40px 24px', maxWidth: '600px', margin: '80px auto',
                color: 'var(--text-primary)', textAlign: 'center'
            }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: 'rgba(62, 166, 255, 0.1)', display: 'grid', placeItems: 'center',
                    margin: '0 auto 24px auto'
                }}>
                    <UploadIcon size={48} color="#3ea6ff" style={{ animation: 'pulse 2s infinite' }} />
                </div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Uploading your video...</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                    This may take a while, depending on the file size.
                </p>

                {/* Progress bar */}
                <div style={{
                    width: '100%', height: '8px', borderRadius: '4px',
                    background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '12px'
                }}>
                    <div style={{
                        height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #3ea6ff, #7dd3fc)',
                        width: `${uploadProgress}%`, transition: 'width 0.5s ease'
                    }} />
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{uploadProgress}% uploaded</p>

                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.4; }
                    }
                `}</style>
            </div>
        );
    }

    // ─── Step 4: Done ─────────────────────────────────────
    if (step === 'done') {
        return (
            <div style={{
                padding: '40px 24px', maxWidth: '600px', margin: '80px auto',
                color: 'var(--text-primary)', textAlign: 'center'
            }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: 'rgba(52, 168, 83, 0.1)', display: 'grid', placeItems: 'center',
                    margin: '0 auto 24px auto'
                }}>
                    <CheckCircle2 size={56} color="#34a853" />
                </div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Video published!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Your video has been uploaded successfully. Redirecting to home...
                </p>
            </div>
        );
    }

    return null;
};

export default Upload;
