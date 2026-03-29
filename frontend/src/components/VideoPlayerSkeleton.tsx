import Skeleton from './Skeleton';

export default function VideoPlayerSkeleton() {
    return (
        <div className="video-page-layout">
            {/* Left Column: Video + Info */}
            <div className="video-page-main" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Video Player */}
                <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
                    <Skeleton width="100%" height="100%" />
                </div>

                {/* Title */}
                <Skeleton width="70%" height="28px" />

                {/* Channel + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Skeleton width="42px" height="42px" borderRadius="50%" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Skeleton width="120px" height="16px" />
                            <Skeleton width="80px" height="12px" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Skeleton width="70px" height="34px" borderRadius="24px" />
                        <Skeleton width="70px" height="34px" borderRadius="24px" />
                        <Skeleton width="70px" height="34px" borderRadius="24px" />
                    </div>
                </div>

                {/* Description */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px' }}>
                    <Skeleton width="100%" height="14px" style={{ marginBottom: '6px' }} />
                    <Skeleton width="85%" height="14px" style={{ marginBottom: '6px' }} />
                    <Skeleton width="40%" height="14px" />
                </div>
            </div>

            {/* Right Column: Related Videos */}
            <div className="video-page-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Skeleton width="130px" height="20px" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                        <Skeleton width="180px" height="100px" borderRadius="8px" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' }}>
                            <Skeleton width="100%" height="14px" />
                            <Skeleton width="80%" height="14px" />
                            <Skeleton width="70px" height="12px" />
                            <Skeleton width="90px" height="12px" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
