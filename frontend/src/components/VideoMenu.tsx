import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Watch, Share2, Flag, Trash2, Pencil, Check } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useToast } from './Toast';
import ShareModal from './ShareModal';
import ReportModal from './ReportModal';
import { useTranslation } from '../i18n';

interface VideoMenuProps {
    videoId: string;
    videoTitle: string;
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function VideoMenu({ videoId, videoTitle, isOwner, onEdit, onDelete }: VideoMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isWatchLater, setIsWatchLater] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            checkWatchLater();
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const checkWatchLater = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/user/watch-later`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsWatchLater(res.data.some((v: any) => v.id === videoId));
        } catch (err) {
            console.error('Failed to check watch later', err);
        }
    };

    const handleWatchLater = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to save video', 'error');
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/user/watch-later/${videoId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const added = res.data.watchLater;
            setIsWatchLater(added);
            showToast(added ? 'Added to Watch Later' : 'Removed from Watch Later', 'success');
            // Close menu after short delay to show the toggled state briefly if requested, but user wants abnormality prevention
            setIsOpen(false);
        } catch (err) {
            showToast('Failed to update Watch Later', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                className="hover-bg"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', right: 0, top: '100%', zIndex: 1000,
                    background: 'var(--bg-secondary)', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '220px',
                    overflow: 'hidden', border: '1px solid var(--border)',
                    animation: 'fadeIn 0.1s ease'
                }}>
                    {isOwner && onEdit && onDelete && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }} className="menu-item">
                                <Pencil size={16} /> {t('editVideo' as any)}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(); }} className="menu-item" style={{ color: '#ff4444' }}>
                                <Trash2 size={16} /> {t('deleteVideo' as any)}
                            </button>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                        </>
                    )}

                    <button
                        onClick={handleWatchLater}
                        className={`menu-item ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner-small" />
                        ) : isWatchLater ? (
                            <><Check size={16} color="var(--accent)" /> Remove from {t('watchLater')}</>
                        ) : (
                            <><Watch size={16} /> {t('saveWatchLater' as any)}</>
                        )}
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsShareModalOpen(true); }} className="menu-item">
                        <Share2 size={16} /> {t('share')}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsReportModalOpen(true); }} className="menu-item">
                        <Flag size={16} /> {t('report')}
                    </button>
                </div>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                videoId={videoId}
                videoTitle={videoTitle}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                videoId={videoId}
            />

            <style>{`
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                    font-size: 14px;
                    text-align: left;
                    transition: background 0.15s;
                    font-family: inherit;
                }
                .menu-item:hover {
                    background: var(--bg-hover);
                }
                .menu-item.loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid var(--border);
                    border-top: 2px solid var(--accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
