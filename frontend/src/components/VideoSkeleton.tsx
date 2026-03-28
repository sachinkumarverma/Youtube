import Skeleton from './Skeleton';

export default function VideoSkeleton() {
    return (
        <div className="video-card-container">
            <div className="thumbnail-wrapper" style={{ border: 'none', height: '200px' }}>
                <Skeleton borderRadius="16px" width="100%" height="100%" />
            </div>
            <div className="video-card-info" style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
                <Skeleton width="36px" height="36px" borderRadius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton width="90%" height="16px" />
                    <Skeleton width="60%" height="14px" />
                    <Skeleton width="40%" height="12px" />
                </div>
            </div>
        </div>
    );
}

