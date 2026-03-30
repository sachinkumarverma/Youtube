import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, Users, ThumbsUp, Video, TrendingUp, Play, Clock, MessageSquare, Percent, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useTranslation } from '../i18n';
import { formatDuration } from '../utils/format';

type Period = '28d' | '90d' | '365d';

interface Overview {
    totalViews: number;
    totalSubscribers: number;
    totalLikes: number;
    totalVideos: number;
    totalComments: number;
    estimatedWatchHours: number;
    avgViewsPerVideo: number;
    engagementRate: number;
    latestVideo: any;
}

export default function Analytics() {
    const [period, setPeriod] = useState<Period>('28d');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [subsData, setSubsData] = useState<any[]>([]);
    const [viewsData, setViewsData] = useState<any[]>([]);
    const [likesData, setLikesData] = useState<any[]>([]);
    const [commentsData, setCommentsData] = useState<any[]>([]);
    const [topVideos, setTopVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const [ovRes, topRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/analytics/overview`, { headers }),
                    axios.get(`${API_BASE_URL}/analytics/top-videos`, { headers })
                ]);
                setOverview(ovRes.data);
                setTopVideos(topRes.data);
            } catch (err) { console.error(err); }
        };
        fetchOverview();
    }, []);

    useEffect(() => {
        const fetchCharts = async () => {
            setLoading(true);
            try {
                const [subsRes, viewsRes, likesRes, commentsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/analytics/subscribers?period=${period}`, { headers }),
                    axios.get(`${API_BASE_URL}/analytics/views?period=${period}`, { headers }),
                    axios.get(`${API_BASE_URL}/analytics/likes?period=${period}`, { headers }),
                    axios.get(`${API_BASE_URL}/analytics/comments?period=${period}`, { headers })
                ]);
                setSubsData(subsRes.data);
                setViewsData(viewsRes.data);
                setLikesData(likesRes.data);
                setCommentsData(commentsRes.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchCharts();
    }, [period]);

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatNum = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    const statCards = overview ? [
        { label: t('totalViews'), value: formatNum(overview.totalViews), icon: Eye, color: '#3b82f6' },
        { label: t('subscribers'), value: formatNum(overview.totalSubscribers), icon: Users, color: '#ef4444' },
        { label: t('totalLikes'), value: formatNum(overview.totalLikes), icon: ThumbsUp, color: '#22c55e' },
        { label: t('totalVideos'), value: formatNum(overview.totalVideos), icon: Video, color: '#a855f7' },
        { label: t('comments'), value: formatNum(overview.totalComments), icon: MessageSquare, color: '#eab308' },
        { label: t('watchHours'), value: formatNum(overview.estimatedWatchHours) + 'h', icon: Clock, color: '#f97316' },
        { label: t('avgViews'), value: formatNum(overview.avgViewsPerVideo), icon: BarChart3, color: '#06b6d4' },
        { label: t('engagement'), value: overview.engagementRate + '%', icon: Percent, color: '#ec4899' },
    ] : [];

    const periodOptions: { key: Period; label: string }[] = [
        { key: '28d', label: t('last28Days') },
        { key: '90d', label: t('last90Days') },
        { key: '365d', label: t('lastYear') },
    ];

    const renderAreaChart = (title: string, data: any[], dataKey: string, color: string, gradientId: string) => (
        <div className="analytics-chart-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color={color} /> {title}
            </h3>
            <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="var(--text-secondary)" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} interval={Math.max(0, Math.floor(data.length / 6))} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)' }} labelFormatter={formatDate} />
                        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const latestVideo = overview?.latestVideo;

    return (
        <div className="analytics-page animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{t('analytics')}</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {periodOptions.map(p => (
                        <button key={p.key} className={`category-pill ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            {overview && (
                <div className="analytics-summary-grid">
                    {statCards.map((s, i) => (
                        <div key={i} className="analytics-stat-card">
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}15`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                <s.icon size={22} color={s.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Latest Video Performance */}
            {latestVideo && (
                <div className="analytics-chart-card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Play size={18} color="#a855f7" /> Latest Video Performance
                    </h3>
                    <Link to={`/video/${latestVideo.id}`} className="analytics-latest-video" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '220px', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                            {latestVideo.thumbnail_url ? (
                                <img src={latestVideo.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'grid', placeItems: 'center' }}><Video size={24} color="var(--text-secondary)" /></div>
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>{latestVideo.title}</div>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6' }}>{formatNum(latestVideo.views)}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Views</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e' }}>{latestVideo.likes_count}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Likes</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#eab308' }}>{latestVideo.comments_count}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Comments</div>
                                </div>
                                {overview && overview.avgViewsPerVideo > 0 && (
                                    <div>
                                        <div style={{ fontSize: '22px', fontWeight: 800, color: latestVideo.views >= overview.avgViewsPerVideo ? '#22c55e' : '#ef4444' }}>
                                            {latestVideo.views >= overview.avgViewsPerVideo ? '+' : ''}{Math.round(((latestVideo.views - overview.avgViewsPerVideo) / overview.avgViewsPerVideo) * 100)}%
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>vs Average</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Charts */}
            {!loading && (
                <div className="analytics-charts-grid">
                    {renderAreaChart(t('subscriberGrowth'), subsData, 'total', '#ef4444', 'gradSubs')}
                    {renderAreaChart(t('viewsOverTime'), viewsData, 'views', '#3b82f6', 'gradViews')}
                    {renderAreaChart(t('likesOverTime'), likesData, 'likes', '#22c55e', 'gradLikes')}
                    {renderAreaChart(t('commentsOverTime'), commentsData, 'comments', '#eab308', 'gradComments')}
                </div>
            )}

            {/* Views by Video - Bar Chart */}
            {topVideos.length > 0 && (
                <div className="analytics-chart-card" style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} color="#06b6d4" /> Views by Video
                    </h3>
                    <div style={{ width: '100%', height: Math.max(200, topVideos.length * 44) }}>
                        <ResponsiveContainer>
                            <BarChart data={topVideos.map(v => ({ ...v, name: v.title.length > 30 ? v.title.slice(0, 30) + '...' : v.title }))} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis type="category" dataKey="name" width={150} stroke="var(--text-secondary)" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)' }} />
                                <Bar dataKey="views" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Top Videos List */}
            {topVideos.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Play size={20} color="#a855f7" /> {t('topVideos')}
                    </h2>
                    <div className="analytics-top-videos">
                        {topVideos.map((v, i) => (
                            <Link to={`/video/${v.id}`} key={v.id} className="analytics-video-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <span className="analytics-video-rank">{i + 1}</span>
                                <div className="analytics-video-thumb">
                                    {v.thumbnail_url ? (
                                        <img src={v.thumbnail_url} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
                                            <Video size={20} color="var(--text-secondary)" />
                                        </div>
                                    )}
                                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '4px' }}>{formatDuration(v.duration)}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <span>{formatNum(v.views)} views</span>
                                        <span>{v.likes_count} likes</span>
                                        <span>{v.comments_count} comments</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
