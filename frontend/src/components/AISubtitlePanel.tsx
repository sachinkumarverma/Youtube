import { useState, useRef, useEffect, useCallback } from 'react';
import { Captions, Loader2, StopCircle, Languages, ChevronDown, AlertCircle } from 'lucide-react';

const LANGUAGES = [
    { code: 'en-US', label: 'English', translateTo: 'en' },
    { code: 'hi-IN', label: 'Hindi', translateTo: 'hi' },
    { code: 'es-ES', label: 'Spanish', translateTo: 'es' },
    { code: 'fr-FR', label: 'French', translateTo: 'fr' },
    { code: 'de-DE', label: 'German', translateTo: 'de' },
    { code: 'ja-JP', label: 'Japanese', translateTo: 'ja' },
    { code: 'ko-KR', label: 'Korean', translateTo: 'ko' },
    { code: 'pt-BR', label: 'Portuguese', translateTo: 'pt' },
    { code: 'ar-SA', label: 'Arabic', translateTo: 'ar' },
];

export default function AISubtitlePanel() {
    const [isListening, setIsListening] = useState(false);
    const [subtitle, setSubtitle] = useState('');
    const [translatedSubtitle, setTranslatedSubtitle] = useState('');
    const [sourceLang, setSourceLang] = useState('en-US');
    const [targetLang, setTargetLang] = useState('hi');
    const [showTranslation, setShowTranslation] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const recognitionRef = useRef<any>(null);
    const translateTimeoutRef = useRef<any>(null);

    const translateText = useCallback(async (text: string, to: string) => {
        if (to === 'en' || !text.trim()) return;

        setIsTranslating(true);
        try {
            // Load Puter.js if not already loaded
            if (!(window as any).puter) {
                await new Promise<void>((resolve, reject) => {
                    if (document.querySelector('script[src="https://js.puter.com/v2/"]')) {
                        const check = setInterval(() => {
                            if ((window as any).puter) { clearInterval(check); resolve(); }
                        }, 100);
                        setTimeout(() => { clearInterval(check); reject(new Error('timeout')); }, 10000);
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = 'https://js.puter.com/v2/';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Puter.js'));
                    document.head.appendChild(script);
                });
            }

            const langLabel = LANGUAGES.find(l => l.translateTo === to)?.label || to;
            const response = await (window as any).puter.ai.chat(
                `Translate this to ${langLabel}. Only return the translated text, nothing else: "${text}"`,
                { model: 'gpt-4o-mini' }
            );
            const translated = typeof response === 'string'
                ? response.trim()
                : (response?.message?.content || response?.text || '').trim();
            if (translated) setTranslatedSubtitle(translated);
        } catch (e) {
            console.error('Translation error:', e);
        } finally {
            setIsTranslating(false);
        }
    }, []);

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        setError('');
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = sourceLang;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            let interimText = '';
            let finalText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalText += t;
                else interimText += t;
            }
            const currentText = finalText || interimText;
            setSubtitle(currentText);

            if (showTranslation && finalText) {
                clearTimeout(translateTimeoutRef.current);
                translateTimeoutRef.current = setTimeout(() => translateText(finalText, targetLang), 500);
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted') {
                setError(`Microphone error: ${event.error}. Make sure microphone access is granted.`);
                setIsListening(false);
            }
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
        setIsListening(true);
    };

    const stopListening = () => {
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        setIsListening(false);
    };

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
            clearTimeout(translateTimeoutRef.current);
        };
    }, []);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(16,185,129,0.06) 100%)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '16px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #22c55e, #10b981)',
                        display: 'grid', placeItems: 'center',
                        boxShadow: '0 4px 12px rgba(34,197,94,0.35)'
                    }}>
                        <Captions size={16} color="white" />
                    </div>
                    <div>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                            Auto Subtitles
                        </span>
                        <span style={{
                            marginLeft: '8px', fontSize: '11px', fontWeight: '600',
                            background: 'linear-gradient(90deg, #22c55e, #10b981)',
                            padding: '2px 8px', borderRadius: '20px', color: 'white'
                        }}>+ Translation</span>
                        {isListening && (
                            <span style={{
                                marginLeft: '8px', fontSize: '11px',
                                background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                padding: '2px 8px', borderRadius: '20px',
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                                <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: '#ef4444', display: 'inline-block',
                                    animation: 'subtitlePulse 1s ease-in-out infinite'
                                }} />
                                LIVE
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown size={18} color="var(--text-secondary)" style={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                }} />
            </div>

            {expanded && (
                <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(34,197,94,0.3), transparent)' }} />

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Source Language */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                SPEAK IN
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={sourceLang}
                                    onChange={e => setSourceLang(e.target.value)}
                                    disabled={isListening}
                                    style={{
                                        padding: '7px 28px 7px 10px', borderRadius: '8px',
                                        border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
                                        appearance: 'none', outline: 'none'
                                    }}
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Translation toggle */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                TRANSLATE TO
                            </label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    onClick={() => setShowTranslation(!showTranslation)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '7px 12px', borderRadius: '8px',
                                        border: `1px solid ${showTranslation ? '#22c55e' : 'var(--border)'}`,
                                        background: showTranslation ? 'rgba(34,197,94,0.1)' : 'var(--bg-primary)',
                                        color: showTranslation ? '#22c55e' : 'var(--text-secondary)',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: '600'
                                    }}
                                >
                                    <Languages size={14} />
                                    {showTranslation ? 'ON' : 'OFF'}
                                </button>
                                {showTranslation && (
                                    <select
                                        value={targetLang}
                                        onChange={e => setTargetLang(e.target.value)}
                                        style={{
                                            padding: '7px 10px', borderRadius: '8px',
                                            border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        {LANGUAGES.map(l => (
                                            <option key={l.translateTo} value={l.translateTo}>{l.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Start/Stop */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: 'transparent' }}>BTN</label>
                            <button
                                onClick={isListening ? stopListening : startListening}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    padding: '8px 16px',
                                    background: isListening
                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                        : 'linear-gradient(135deg, #22c55e, #10b981)',
                                    color: 'white', border: 'none', borderRadius: '10px',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                                    boxShadow: isListening
                                        ? '0 4px 12px rgba(239,68,68,0.3)'
                                        : '0 4px 12px rgba(34,197,94,0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isListening ? <StopCircle size={15} /> : <Captions size={15} />}
                                {isListening ? 'Stop' : 'Start Live Subtitles'}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            display: 'flex', gap: '8px', alignItems: 'flex-start',
                            background: 'rgba(239,68,68,0.08)', borderRadius: '10px',
                            padding: '10px 12px', border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {/* Subtitle Display */}
                    {(isListening || subtitle) && (
                        <div style={{
                            background: 'rgba(0,0,0,0.85)', borderRadius: '12px',
                            padding: '16px 20px', minHeight: '60px',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <p style={{
                                fontSize: '16px', fontWeight: '600', color: 'white',
                                margin: 0, lineHeight: '1.5', textAlign: 'center',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}>
                                {subtitle || (isListening ? '...' : '')}
                            </p>
                            {showTranslation && (translatedSubtitle || isTranslating) && (
                                <p style={{
                                    fontSize: '14px', color: '#86efac', margin: 0,
                                    textAlign: 'center', lineHeight: '1.5'
                                }}>
                                    {isTranslating ? (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                            Translating...
                                        </span>
                                    ) : translatedSubtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {!isListening && !subtitle && !error && (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                            🎙️ Click "Start Live Subtitles" and speak along — subtitles will appear in real-time using your microphone. Works best in Chrome or Edge.
                        </p>
                    )}
                </div>
            )}

            <style>{`
                @keyframes subtitlePulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
