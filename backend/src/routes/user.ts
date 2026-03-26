import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient() as any;

// Get subscriptions
router.get('/subscriptions', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const subs = await prisma.subscription.findMany({
            where: { subscriber_id: req.user.id },
            include: {
                channel: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        _count: { select: { subscribers: true } }
                    }
                }
            }
        }) as any;
        res.json(subs);

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle subscription
router.post('/subscribe/:channel_id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const subscriber_id = req.user.id;
        const channel_id = req.params.channel_id as string;
        if (subscriber_id === channel_id) return res.status(400).json({ error: 'Cannot subscribe to yourself' });

        const existing = await prisma.subscription.findUnique({
            where: { subscriber_id_channel_id: { subscriber_id, channel_id } }
        });

        if (existing) {
            await prisma.subscription.delete({ where: { id: existing.id } });
            res.json({ subscribed: false });
        } else {
            await prisma.subscription.create({ data: { subscriber_id, channel_id } });

            // Notify Channel Owner
            const follower = await prisma.user.findUnique({ where: { id: subscriber_id } });
            await prisma.notification.create({
                data: {
                    user_id: channel_id,
                    title: 'New Subscriber',
                    content: `${follower?.username} subscribed to your channel!`,
                    type: 'NEW_SUBSCRIBER',
                    from_user_id: subscriber_id
                }
            });

            res.json({ subscribed: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle notifications
router.post('/subscribe/:channel_id/toggle-notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const channel_id = req.params.channel_id as string;
        const sub = await prisma.subscription.findUnique({
            where: { subscriber_id_channel_id: { subscriber_id: req.user.id, channel_id } }
        });
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        const updated = await prisma.subscription.update({
            where: { id: sub.id },
            data: { notifications_on: !sub.notifications_on }
        });
        res.json({ notifications_on: updated.notifications_on });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Watch Later Operations
router.get('/watch-later', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const watchLaterItems = await prisma.watchLater.findMany({
            where: { user_id: req.user.id },
            include: {
                video: {
                    include: { user: { select: { id: true, username: true, avatar_url: true } } }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(watchLaterItems.map((item: any) => item.video));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/watch-later/:video_id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const user_id = req.user.id;
        const video_id = req.params.video_id as string;

        const existing = await prisma.watchLater.findUnique({
            where: { user_id_video_id: { user_id, video_id } }
        });

        if (existing) {
            await prisma.watchLater.delete({ where: { id: existing.id } });
            res.json({ watchLater: false });
        } else {
            await prisma.watchLater.create({ data: { user_id, video_id } });
            res.json({ watchLater: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// History endpoint
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const historyItems = await prisma.history.findMany({
            where: { user_id: req.user.id },
            include: {
                video: {
                    include: { user: { select: { id: true, username: true, avatar_url: true } } }
                }
            },
            orderBy: { viewed_at: 'desc' },
            take: 50
        });
        res.json(historyItems.map((item: any) => ({ ...item.video, viewed_at: item.viewed_at })));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/history/:video_id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const user_id = req.user.id;
        const video_id = req.params.video_id as string;

        await prisma.history.upsert({
            where: { user_id_video_id: { user_id, video_id } },
            update: { viewed_at: new Date() },
            create: { user_id, video_id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Liked Videos
router.get('/liked', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const likes = await prisma.like.findMany({
            where: { user_id: req.user.id, type: 'LIKE' },
            include: {
                video: {
                    include: { user: { select: { id: true, username: true, avatar_url: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.json((likes as any[]).map((l: any) => ({ ...l.video, created_at: l.created_at })));
    } catch (error) {

        res.status(500).json({ error: 'Server error' });
    }
});

// My Channel (Your Videos)
router.get('/channel', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const videos = await prisma.video.findMany({
            where: { user_id: req.user.id },
            include: { user: { select: { id: true, username: true, avatar_url: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Public Channel Info
router.get('/channel/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                username: true,
                avatar_url: true,
                banner_url: true,
                about: true,
                created_at: true,
                _count: { select: { subscribers: true, videos: true } }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const videos = await prisma.video.findMany({
            where: { user_id: req.params.id },
            include: { user: { select: { id: true, username: true, avatar_url: true } } },
            orderBy: { created_at: 'desc' }
        });

        const totalViews = videos.reduce((acc, v) => acc + v.views, 0);

        res.json({ user, videos, totalViews });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


export default router;
