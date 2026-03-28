import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

interface AISummaryPanelProps {
    videoTitle: string;
    videoDescription: string;
    videoCategory?: string;
    videoDuration?: string;
    channelName?: string;
}

export default function AISummaryPanel({
    videoTitle,
    videoDescription,
    videoCategory,
    videoDuration,
    channelName,
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

        const prompt = `You are a helpful assistant that summarizes YouTube videos based on their metadata.

Video Title: "${videoTitle}"
Channel: "${channelName || 'Unknown'}"
Category: "${videoCategory || 'General'}"
Duration: "${videoDuration || 'Unknown'}"
Description: "${videoDescription || 'No description provided.'}"

Please provide a concise, engaging 3-4 sentence summary of what this video is likely about. Mention the key topics, what the viewer will learn or experience, and who it's best suited for. Write in a friendly, informative tone. Do not say "this video is likely about" — just summarize directly as if you know the content.`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
                    })
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'Gemini API request failed');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
                padding: '14px 20px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'grid', placeItems: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                    }}>
                        <Sparkles size={16} color="white" />
                    </div>
                    <div>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>AI Summary</span>
                        <span style={{
                            marginLeft: '8px', fontSize: '11px', fontWeight: '600',
                            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                            padding: '2px 8px', borderRadius: '20px', color: 'white'
                        }}>Powered by Gemini</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!generated && !loading && (
                        <button
                            onClick={generateSummary}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: 'white', border: 'none', borderRadius: '20px',
                                cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Sparkles size={14} />
                            Generate Summary
                        </button>
                    )}
                    {generated && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={{
                                background: 'transparent', border: '1px solid rgba(99,102,241,0.3)',
                                color: '#a855f7', borderRadius: '20px', cursor: 'pointer',
                                padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expanded ? 'Hide' : 'Show'}
                        </button>
                    )}
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '13px' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Generating...
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {expanded && (
                <div style={{ padding: '0 20px 18px 20px' }}>
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
