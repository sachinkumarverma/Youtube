import Skeleton from './Skeleton';

export default function VideoPlayerSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {/* Video Player Skeleton */}
            <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden' }}>
                <Skeleton width="100%" height="100%" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Title Skeleton */}
                <Skeleton width="70%" height="32px" />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Avatar and Channel Skeleton */}
                        <Skeleton width="48px" height="48px" borderRadius="50%" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Skeleton width="120px" height="18px" />
                            <Skeleton width="180px" height="14px" />
                        </div>
                    </div>
                    {/* Action Buttons Skeleton */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Skeleton width="80px" height="36px" borderRadius="24px" />
                        <Skeleton width="80px" height="36px" borderRadius="24px" />
                        <Skeleton width="80px" height="36px" borderRadius="24px" />
                    </div>
                </div>

                {/* Description Skeleton */}
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                    <Skeleton width="100%" height="16px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="90%" height="16px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height="16px" />
                </div>
            </div>

            {/* Comments Area Skeleton */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Skeleton width="150px" height="24px" />
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Skeleton width="40px" height="40px" borderRadius="50%" />
                    <Skeleton width="100%" height="40px" borderRadius="8px" />
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px' }}>
                        <Skeleton width="40px" height="40px" borderRadius="50%" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Skeleton width="150px" height="14px" />
                            <Skeleton width="100%" height="16px" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
