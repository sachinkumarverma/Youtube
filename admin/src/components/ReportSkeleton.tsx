import Skeleton from './Skeleton';

export default function ReportSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(4)].map((_, i) => (
                <div key={i} className="report-card" style={{ display: 'flex', gap: '20px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Skeleton width="80px" height="24px" borderRadius="12px" />
                            <Skeleton width="150px" height="14px" />
                        </div>
                        <Skeleton width="400px" height="20px" />
                        <Skeleton width="300px" height="14px" />
                        <Skeleton width="100%" height="60px" borderRadius="8px" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                        <Skeleton width="120px" height="32px" borderRadius="8px" />
                        <Skeleton width="120px" height="32px" borderRadius="8px" />
                        <Skeleton width="120px" height="32px" borderRadius="8px" />
                    </div>
                </div>
            ))}
        </div>
    );
}
