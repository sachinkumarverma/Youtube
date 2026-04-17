import { useState, useEffect } from 'react';
import { Wand2, Loader2, Download, AlertCircle, ChevronDown, Image } from 'lucide-react';

declare global {
    interface Window {
        puter: {
            ai: {
                txt2img: (prompt: string, options?: { model?: string }) => Promise<HTMLImageElement>;
            };
        };
    }
}

interface AIThumbnailGeneratorProps {
    videoTitle: string;
    videoCategory: string;
    onSelectThumbnail: (imageBlob: Blob, previewUrl: string) => void;
}

const STYLES = [
    { id: 'cinematic', label: '🎬 Cinematic' },
    { id: 'minimalist', label: '✨ Minimalist' },
    { id: 'bold-text', label: '📢 Bold & Text' },
    { id: 'vibrant', label: '🎨 Vibrant' },
    { id: 'dark-theme', label: '🌙 Dark Theme' },
];

const STYLE_PROMPTS: Record<string, string> = {
    'cinematic': 'cinematic wide shot, dramatic lighting, professional photography, film quality, 16:9 aspect ratio',
    'minimalist': 'clean minimalist design, simple color background, elegant typography, modern flat design',
    'bold-text': 'bold colorful text overlay, high contrast, eye-catching, YouTube thumbnail style, vibrant colors',
    'vibrant': 'vibrant saturated colors, dynamic composition, energetic, highly detailed illustration',
    'dark-theme': 'dark dramatic background, glowing neon accents, moody atmosphere, professional thumbnail',
};

const AI_MODEL = 'black-forest-labs/FLUX.1-schnell';

function loadPuterScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.puter) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Puter.js'));
        document.head.appendChild(script);
    });
}

function imageElementToBlob(img: HTMLImageElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.drawImage(img, 0, 0, 1280, 720);

        canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create image blob'));
        }, 'image/png');
    });
}

export default function AIThumbnailGenerator({ videoTitle, videoCategory, onSelectThumbnail }: AIThumbnailGeneratorProps) {
    const [expanded, setExpanded] = useState(false);
    const [style, setStyle] = useState('cinematic');
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<{ url: string; blob: Blob }[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [puterReady, setPuterReady] = useState(false);

    useEffect(() => {
        loadPuterScript()
            .then(() => setPuterReady(true))
            .catch(() => setError('Failed to load AI image service.'));
    }, []);

    const buildPrompt = (variant: number) => {
        const base = customPrompt.trim() || `YouTube thumbnail for a video titled "${videoTitle}" in ${videoCategory} category`;
        const styleDesc = STYLE_PROMPTS[style] || '';
        return `${base}, ${styleDesc}, YouTube thumbnail, high quality, professional, variation ${variant + 1}`;
    };

    const generateImage = async (prompt: string): Promise<{ url: string; blob: Blob }> => {
        const imgElement = await window.puter.ai.txt2img(prompt, { model: AI_MODEL });
        const blob = await imageElementToBlob(imgElement);
        const url = URL.createObjectURL(blob);
        return { url, blob };
    };

    const generate = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        if (!puterReady) {
            setError('AI service is still loading. Please try again.');
            return;
        }

        setLoading(true);
        setError('');
        setSelectedIdx(null);
        setGeneratedImages([]);

        try {
            const results = await Promise.all(
                [0, 1, 2].map(i => generateImage(buildPrompt(i)))
            );
            setGeneratedImages(results);
        } catch (err: any) {
            setError(err.message || 'Failed to generate thumbnails. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectImage = (item: { url: string; blob: Blob }, idx: number) => {
        setSelectedIdx(idx);
        onSelectThumbnail(item.blob, item.url);
    };

    const downloadImage = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_thumbnail_${Date.now()}.png`;
        a.click();
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(239,68,68,0.06) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginTop: '16px'
        }}>
            {/* Header */}
            <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'grid', placeItems: 'center',
                        boxShadow: '0 4px 12px rgba(245,158,11,0.4)'
                    }}>
                        <Wand2 size={16} color="white" />
                    </div>
                    <div>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>AI Thumbnail Generator</span>
                        <span style={{
                            marginLeft: '8px', fontSize: '11px', fontWeight: '600',
                            background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                            padding: '2px 8px', borderRadius: '20px', color: 'white'
                        }}>Free &bull; Unlimited</span>
                    </div>
                </div>
                <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            {expanded && (
                <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(245,158,11,0.3), transparent)' }} />

                    {/* Style Selector */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>THUMBNAIL STYLE</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {STYLES.map(s => (
                                <button
                                    type="button"
                                    key={s.id}
                                    onClick={() => setStyle(s.id)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                                        fontWeight: '600', cursor: 'pointer', border: '1px solid',
                                        borderColor: style === s.id ? '#f59e0b' : 'var(--border)',
                                        background: style === s.id ? 'rgba(245,158,11,0.12)' : 'var(--bg-primary)',
                                        color: style === s.id ? '#f59e0b' : 'var(--text-secondary)',
                                        transition: 'all 0.2s'
                                    }}
                                >{s.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>CUSTOM DESCRIPTION (Optional)</label>
                        <input
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            placeholder={`e.g. "a person gaming with dramatic neon background"`}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: '10px',
                                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Generate Button */}
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', padding: '12px',
                            background: loading ? 'var(--bg-hover)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            color: loading ? 'var(--text-secondary)' : 'white',
                            border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px', fontWeight: '700',
                            boxShadow: loading ? 'none' : '0 4px 16px rgba(245,158,11,0.35)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating 3 AI thumbnails...</>
                        ) : (
                            <><Wand2 size={16} /> {generatedImages.length > 0 ? 'Regenerate' : 'Generate Thumbnails (3 Variants)'}</>
                        )}
                    </button>

                    {error && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {/* Generated Images */}
                    {generatedImages.length > 0 && !loading && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                                CLICK TO USE AS THUMBNAIL
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {generatedImages.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectImage(item, idx)}
                                        style={{
                                            aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden',
                                            cursor: 'pointer', position: 'relative',
                                            border: selectedIdx === idx ? '2px solid #f59e0b' : '2px solid transparent',
                                            boxShadow: selectedIdx === idx ? '0 0 0 2px rgba(245,158,11,0.3)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <img
                                            src={item.url}
                                            alt={`AI Thumbnail ${idx + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />
                                        {selectedIdx === idx && (
                                            <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#f59e0b', borderRadius: '50%', width: '22px', height: '22px', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 'bold', color: 'white' }}>✓</div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => downloadImage(item.url, e)}
                                            title="Download"
                                            style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                                        >
                                            <Download size={13} color="white" />
                                        </button>
                                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', color: 'white', fontWeight: '600' }}>#{idx + 1}</div>
                                    </div>
                                ))}
                            </div>
                            {selectedIdx !== null && (
                                <p style={{ marginTop: '10px', fontSize: '13px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Image size={14} />
                                    Thumbnail #{selectedIdx + 1} selected — it will be used as your video thumbnail.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
