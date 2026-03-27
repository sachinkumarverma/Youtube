import Skeleton from './Skeleton';

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
}

export default function TableSkeleton({ rows = 6, cols = 5 }: TableSkeletonProps) {
    return (
        <div className="table-container">
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        {[...Array(cols)].map((_, i) => (
                            <th key={i} style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                                <Skeleton width="80px" height="14px" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(rows)].map((_, i) => (
                        <tr key={i}>
                            {[...Array(cols)].map((_, j) => (
                                <td key={j} style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                                    <Skeleton width={j === 0 ? "150px" : "100px"} height="16px" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
