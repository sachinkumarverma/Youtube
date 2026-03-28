import { Link } from 'react-router-dom';
import { formatDuration } from '../utils/format';
import { useTranslation } from '../i18n';
import VideoMenu from './VideoMenu';

interface VideoCardProps {
    video: any;
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function VideoCard({ video, isOwner, onEdit, onDelete }: VideoCardProps) {
    const { t } = useTranslation();

    const formatViews = (views: number) => {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return views;
    };

    const getDaysAgo = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 3600 * 24));
        if (days === 0) return t('today');
        if (days === 1) return `1 ${t('daysAgo')}`;
        return `${days} ${t('daysAgo')}`;
    };

    function checkOwnership() {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return false;
        return user.id === video.user_id;
    }

    const isVideoOwner = isOwner !== undefined ? isOwner : checkOwnership();
    const hideChannelInfo = isOwner === true;

    return (
        <div className="video-card-container" style={{ position: 'relative' }}>
            <Link to={`/video/${video.id}`} className="video-card" style={{ textDecoration: 'none' }}>
                <div className="thumbnail-wrapper">
                    {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="thumbnail-img" />
                    ) : (
                        <video
                            src={`${video.video_url}#t=1.0`}
                            className="thumbnail-img"
                            preload="metadata"
                            muted
                            playsInline
                            disablePictureInPicture
                            controlsList="nodownload nofullscreen noplaybackrate"
                            style={{ objectFit: 'cover', pointerEvents: 'none' }}
                        />
                    )}
                    <span className="video-duration">{formatDuration(video.duration)}</span>
                </div>
            </Link>

            <div className="video-card-info" style={{ display: 'flex', gap: '12px', padding: '12px 0', position: 'relative' }}>
                {!hideChannelInfo && video.user && (
                    <Link to={`/channel/${video.user_id}`} className="avatar" style={{ overflow: 'hidden', background: video.user.avatar_url ? 'transparent' : '', cursor: 'pointer', textDecoration: 'none', color: 'inherit', width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}>
                        {video.user.avatar_url ? (
                            <img src={video.user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', fontWeight: 'bold' }}>
                                {video.user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>
                )}

                <div className="video-details" style={{ flex: 1, minWidth: 0, gap: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <Link to={`/video/${video.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
                            <h3 className="video-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', lineBreak: 'anywhere' }}>{video.title}</h3>
                        </Link>

                        <div style={{ flexShrink: 0 }}>
                            <VideoMenu
                                videoId={video.id}
                                videoTitle={video.title}
                                isOwner={isVideoOwner}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </div>
                    </div>

                    {!hideChannelInfo && video.user && (
                        <Link to={`/channel/${video.user_id}`} className="channel-name" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'block', fontSize: '14px', marginTop: '0' }}>{video.user.username}</Link>
                    )}

                    <span className="video-stats" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '0', display: 'block' }}>
                        {formatViews(video.views)} {t('views')} • {getDaysAgo(video.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
}
