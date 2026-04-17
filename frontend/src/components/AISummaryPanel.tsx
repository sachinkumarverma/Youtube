import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle, Camera, FileText } from 'lucide-react';

interface AISummaryPanelProps {
    videoTitle: string;
    videoDescription: string;
    videoCategory?: string;
    videoDuration?: string;
    channelName?: string;
    videoUrl?: string;
}

// Capture frames from the video at evenly spaced intervals
function captureFrames(videoUrl: string, count = 6): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'auto';

        video.onloadedmetadata = () => {
            const duration = video.duration;
            if (!duration || duration < 1) {
                reject(new Error('Video too short to capture frames'));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d')!;
            const frames: string[] = [];
            let idx = 0;

            const startOffset = duration * 0.05;
            const endOffset = duration * 0.95;
            const step = (endOffset - startOffset) / (count - 1);
            const timestamps = Array.from({ length: count }, (_, i) => startOffset + step * i);

            const seekAndCapture = () => {
                if (idx >= timestamps.length) {
                    video.src = '';
                    resolve(frames);
                    return;
                }
                video.currentTime = timestamps[idx];
            };

            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                frames.push(dataUrl.split(',')[1]);
                idx++;
                seekAndCapture();
            };

            seekAndCapture();
        };

        video.onerror = () => reject(new Error('Failed to load video for frame capture'));
        setTimeout(() => reject(new Error('Video frame capture timed out')), 20000);
        video.src = videoUrl;
    });
}

// Fallback: capture a single frame using fetch + blob URL (bypasses some CORS issues)
async function captureFrameViaFetch(videoUrl: string, count = 6): Promise<string[]> {
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error('Failed to fetch video');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    try {
        return await new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.muted = true;
            video.preload = 'auto';

            video.onloadedmetadata = () => {
                const duration = video.duration;
                if (!duration || duration < 1) {
                    reject(new Error('Video too short'));
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 360;
                const ctx = canvas.getContext('2d')!;
                const frames: string[] = [];
                let idx = 0;

                const startOffset = duration * 0.05;
                const endOffset = duration * 0.95;
                const step = (endOffset - startOffset) / (count - 1);
                const timestamps = Array.from({ length: count }, (_, i) => startOffset + step * i);

                const seekAndCapture = () => {
                    if (idx >= timestamps.length) {
                        video.src = '';
                        resolve(frames);
                        return;
                    }
                    video.currentTime = timestamps[idx];
                };

                video.onseeked = () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    frames.push(dataUrl.split(',')[1]);
                    idx++;
                    seekAndCapture();
                };

                seekAndCapture();
            };

            video.onerror = () => reject(new Error('Blob video load failed'));
            setTimeout(() => reject(new Error('Blob frame capture timed out')), 20000);
            video.src = blobUrl;
        });
    } finally {
        URL.revokeObjectURL(blobUrl);
    }
}

function loadPuterScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.puter) {
            resolve();
            return;
        }
        if (document.querySelector('script[src="https://js.puter.com/v2/"]')) {
            const check = setInterval(() => {
                if (window.puter) { clearInterval(check); resolve(); }
            }, 100);
            setTimeout(() => { clearInterval(check); reject(new Error('Puter.js load timeout')); }, 10000);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Puter.js'));
        document.head.appendChild(script);
    });
}

export default function AISummaryPanel({
    videoTitle,
    videoDescription,
    videoCategory,
    videoDuration,
    channelName,
    videoUrl,
}: AISummaryPanelProps) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [puterReady, setPuterReady] = useState(false);
    const [mode, setMode] = useState<'video' | 'metadata' | null>(null);

    useEffect(() => {
        loadPuterScript()
            .then(() => setPuterReady(true))
            .catch(() => setError('Failed to load AI service.'));
    }, []);

    const generateSummary = async () => {
        if (!puterReady) {
            setError('AI service is still loading. Please try again.');
            setExpanded(true);
            return;
        }

        setLoading(true);
        setError('');
        setExpanded(true);
        setMode(null);

        try {
            // Try to capture frames from the video for real visual analysis
            let frameContents: any[] = [];
            if (videoUrl) {
                // Method 1: direct crossOrigin load
                try {
                    const frames = await captureFrames(videoUrl, 6);
                    frameContents = frames.map(base64 => ({
                        type: 'image_url' as const,
                        image_url: { url: `data:image/jpeg;base64,${base64}` }
                    }));
                } catch (e1) {
                    console.warn('Direct frame capture failed, trying fetch method...', e1);
                    // Method 2: fetch video as blob first (avoids CORS on canvas)
                    try {
                        const frames = await captureFrameViaFetch(videoUrl, 6);
                        frameContents = frames.map(base64 => ({
                            type: 'image_url' as const,
                            image_url: { url: `data:image/jpeg;base64,${base64}` }
                        }));
                    } catch (e2) {
                        console.warn('Fetch frame capture also failed:', e2);
                    }
                }
            }

            const hasFrames = frameContents.length > 0;
            setMode(hasFrames ? 'video' : 'metadata');

            let textPrompt: string;

            if (hasFrames) {
                textPrompt = `You are analyzing a YouTube video by looking at ${frameContents.length} frames captured at different timestamps throughout the video.

Video Title: "${videoTitle}"
Channel: "${channelName || 'Unknown'}"
Category: "${videoCategory || 'General'}"
Duration: "${videoDuration || 'Unknown'}"
Description: "${videoDescription || 'No description provided.'}"

IMPORTANT INSTRUCTIONS:
- Carefully examine EVERY frame. Describe what you ACTUALLY SEE: the scenes, people, objects, actions, environments, text on screen, colors, UI elements.
- Your summary must be grounded in the visual evidence from the frames. Do NOT make up content that isn't visible.
- Write a detailed 4-6 sentence summary describing the actual video content based on what the frames show.
- Be specific — mention concrete details you observe, not generic descriptions.`;
            } else {
                textPrompt = `Based ONLY on the following metadata, write a brief overview of this YouTube video. Be honest that this is based on the title and description — do NOT invent or assume specific content, scenes, or details that aren't mentioned.

Video Title: "${videoTitle}"
Channel: "${channelName || 'Unknown'}"
Category: "${videoCategory || 'General'}"
Duration: "${videoDuration || 'Unknown'}"
Description: "${videoDescription || 'No description provided.'}"

Write 2-3 sentences. Only state what can be inferred from the metadata above. If the description is empty or vague, say so rather than guessing.`;
            }

            const messageContent = [
                ...frameContents,
                { type: 'text' as const, text: textPrompt }
            ];

            const response = await window.puter.ai.chat(
                [{ role: 'user', content: messageContent }],
                { model: hasFrames ? 'gpt-4o' : 'gpt-4o-mini' }
            );

            const text = typeof response === 'string'
                ? response
                : response?.message?.content || response?.text || '';

            if (!text) throw new Error('No summary generated');
            setSummary(text.trim());
            setGenerated(true);
        } catch (err: any) {
            setError(err.message || 'Failed to generate summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            {/* Header Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                gap: '8px',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'grid', placeItems: 'center', flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                    }}>
                        <Sparkles size={14} color="white" />
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>AI Summary</span>
                    <span style={{
                        fontSize: '10px', fontWeight: '600',
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        padding: '2px 6px', borderRadius: '20px', color: 'white', whiteSpace: 'nowrap'
                    }}>Free &bull; Unlimited</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!generated && !loading && (
                        <button
                            onClick={generateSummary}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: 'white', border: 'none', borderRadius: '20px',
                                cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                            }}
                        >
                            <Sparkles size={12} />
                            Generate
                        </button>
                    )}
                    {generated && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={{
                                background: 'transparent', border: '1px solid rgba(99,102,241,0.3)',
                                color: '#a855f7', borderRadius: '20px', cursor: 'pointer',
                                padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expanded ? 'Hide' : 'Show'}
                        </button>
                    )}
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '12px' }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            {mode === null ? 'Capturing video frames...' : 'Analyzing...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {expanded && (
                <div style={{ padding: '0 14px 14px 14px' }}>
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            background: 'rgba(239,68,68,0.08)', borderRadius: '10px',
                            padding: '12px 14px', border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <p style={{ fontSize: '13px', color: '#ef4444', lineHeight: '1.5', margin: 0 }}>{error}</p>
                        </div>
                    )}
                    {summary && (
                        <div>
                            <div style={{
                                height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.3), transparent)',
                                marginBottom: '14px'
                            }} />

                            {/* Source indicator */}
                            {mode && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    marginBottom: '10px', fontSize: '11px', fontWeight: '600',
                                    color: mode === 'video' ? '#22c55e' : '#f59e0b'
                                }}>
                                    {mode === 'video' ? <Camera size={12} /> : <FileText size={12} />}
                                    {mode === 'video'
                                        ? 'Generated from actual video frames'
                                        : 'Generated from metadata only (video frames unavailable)'}
                                </div>
                            )}

                            <p style={{
                                fontSize: '14px', lineHeight: '1.75', color: 'var(--text-primary)',
                                margin: 0
                            }}>{summary}</p>
                            <button
                                onClick={() => { setSummary(''); setGenerated(false); setExpanded(false); setMode(null); }}
                                style={{
                                    marginTop: '12px', background: 'transparent', border: 'none',
                                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
                                    textDecoration: 'underline', padding: 0
                                }}
                            >
                                Regenerate
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
