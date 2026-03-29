import { useState, useRef } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

interface AISummaryPanelProps {
    videoTitle: string;
    videoDescription: string;
    videoCategory?: string;
    videoDuration?: string;
    channelName?: string;
    videoUrl?: string;
}

// Capture frames from the video at evenly spaced intervals
function captureFrames(videoUrl: string, count = 4): Promise<string[]> {
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

            // Pick evenly spaced timestamps (skip first/last 5%)
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
                // Get base64 data (strip the data:image/jpeg;base64, prefix)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                frames.push(dataUrl.split(',')[1]);
                idx++;
                seekAndCapture();
            };

            seekAndCapture();
        };

        video.onerror = () => reject(new Error('Failed to load video for frame capture'));

        // Timeout after 15 seconds
        setTimeout(() => reject(new Error('Video frame capture timed out')), 15000);

        video.src = videoUrl;
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

    const generateSummary = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            setError('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
            setExpanded(true);
            return;
        }

        setLoading(true);
        setError('');
        setExpanded(true);

        try {
            // Try to capture frames from the video for visual analysis
            let frameParts: any[] = [];
            if (videoUrl) {
                try {
                    const frames = await captureFrames(videoUrl, 4);
                    frameParts = frames.map(base64 => ({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    }));
                } catch {
                    // If frame capture fails (CORS, etc.), fall back to text-only
                    console.warn('Frame capture failed, using text-only summary');
                }
            }

            const textPrompt = frameParts.length > 0
                ? `You are analyzing a YouTube video. Here are ${frameParts.length} frames captured from the video at different timestamps.

Video Title: "${videoTitle}"
Channel: "${channelName || 'Unknown'}"
Category: "${videoCategory || 'General'}"
Duration: "${videoDuration || 'Unknown'}"
Description: "${videoDescription || 'No description provided.'}"

Based on the visual content in these frames AND the metadata, provide a concise, engaging 3-5 sentence summary of what this video is about. Describe what you actually see happening in the frames — the setting, people, actions, text overlays, visuals. Write in a friendly, informative tone. Do not say "based on the frames" or "it appears" — just summarize directly as if you watched it.`
                : `You are a helpful assistant that summarizes YouTube videos based on their metadata.

Video Title: "${videoTitle}"
Channel: "${channelName || 'Unknown'}"
Category: "${videoCategory || 'General'}"
Duration: "${videoDuration || 'Unknown'}"
Description: "${videoDescription || 'No description provided.'}"

Please provide a concise, engaging 3-4 sentence summary of what this video is likely about. Mention the key topics, what the viewer will learn or experience, and who it's best suited for. Write in a friendly, informative tone. Do not say "this video is likely about" — just summarize directly as if you know the content.`;

            const parts = [
                ...frameParts,
                { text: textPrompt }
            ];

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                    })
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'Gemini API request failed');
            }

            const data = await response.json();
            const allParts = data.candidates?.[0]?.content?.parts || [];
            const text = allParts
                .filter((p: any) => p.text)
                .map((p: any) => p.text)
                .join('\n');
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
                    <span className="gemini-badge" style={{
                        fontSize: '10px', fontWeight: '600',
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        padding: '2px 6px', borderRadius: '20px', color: 'white', whiteSpace: 'nowrap'
                    }}>Powered by Gemini</span>
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
                            Generating...
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
                            <p style={{
                                fontSize: '14px', lineHeight: '1.75', color: 'var(--text-primary)',
                                margin: 0
                            }}>{summary}</p>
                            <button
                                onClick={() => { setSummary(''); setGenerated(false); setExpanded(false); }}
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
