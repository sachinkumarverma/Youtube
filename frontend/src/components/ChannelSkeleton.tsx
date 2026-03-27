import Skeleton from './Skeleton';

export default function ChannelSkeleton() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
        }}>
            <Skeleton width="80px" height="80px" borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton width="150px" height="20px" />
                <Skeleton width="200px" height="14px" />
            </div>
            <Skeleton width="120px" height="36px" borderRadius="20px" />
        </div>
    );
}
