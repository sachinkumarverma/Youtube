import Skeleton from './Skeleton';

export default function ChannelSkeleton() {
    return (
        <div className="subscription-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div className="subscription-avatar">
                    <Skeleton width="100%" height="100%" borderRadius="50%" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton width="150px" height="20px" />
                    <Skeleton width="200px" height="14px" />
                </div>
            </div>
            <Skeleton width="120px" height="36px" borderRadius="20px" />
        </div>
    );
}
