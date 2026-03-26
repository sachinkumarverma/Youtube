import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import { supabase } from '../lib/supabase';

const router = Router();
const prisma = new PrismaClient() as any;
const upload = multer({ storage: multer.memoryStorage() });

// Get all videos
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    const videos = await prisma.video.findMany({
      where: {
        ...(category && { category: category as string }),
        ...(q && {
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } }
          ]
        })
      },
      include: { user: { select: { id: true, username: true, avatar_url: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Get trending videos
router.get('/trending', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: { user: { select: { id: true, username: true, avatar_url: true } } },
      orderBy: { views: 'desc' },
      take: 50
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get random videos for Explore
router.get('/explore', async (req, res) => {
  try {
    const count = await prisma.video.count();
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, count - 50)));
    const videos = await prisma.video.findMany({
      include: { user: { select: { id: true, username: true, avatar_url: true } } },
      skip: skip,
      take: 50
    });
    // Shuffle the result for true random order among the block
    const shuffled = videos.sort(() => Math.random() - 0.5);
    res.json(shuffled);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Get subscribed videos
router.get('/subscriptions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const subs = await prisma.subscription.findMany({ where: { subscriber_id: req.user.id } });
    const channelIds = subs.map((s: any) => s.channel_id);

    const videos = await prisma.video.findMany({
      where: { user_id: { in: channelIds } },
      include: { user: { select: { id: true, username: true, avatar_url: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single video
router.get('/:id', async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { id: true, username: true, avatar_url: true } },
        comments: {
          include: { user: { select: { username: true, avatar_url: true } } },
          orderBy: { created_at: 'desc' }
        },
        likes: true
      }
    });
    if (!video) return res.status(404).json({ error: 'Not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload video metadata
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, video_url, thumbnail_url, category, duration } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const video = await prisma.video.create({
      data: {
        title,
        description,
        video_url,
        thumbnail_url,
        category,
        duration: duration || '0:00',
        user_id: req.user.id
      },
      include: { user: { select: { username: true } } }
    });

    // Notify Subscribers
    const subscribers = await prisma.subscription.findMany({
      where: { channel_id: req.user.id, notifications_on: true }
    });

    if (subscribers.length > 0) {
      await prisma.notification.createMany({
        data: subscribers.map(sub => ({
          user_id: sub.subscriber_id,
          title: 'New Video Uploaded',
          content: `${video.user.username} uploaded: ${video.title}`,
          type: 'NEW_VIDEO',
          video_id: video.id,
          from_user_id: req.user?.id
        }))
      });
    }

    res.status(201).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Increment views
router.put('/:id/view', async (req, res) => {
  try {
    await prisma.video.update({
      where: { id: req.params.id as string },
      data: { views: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment
router.post('/:id/comment', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { content } = req.body;

    const video = await prisma.video.findUnique({ where: { id: req.params.id as string } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const comment = await prisma.comment.create({
      data: { content, video_id: req.params.id as string, user_id: req.user.id },
      include: { user: { select: { username: true, avatar_url: true } } }
    });

    // Notify Video Owner
    if (video.user_id !== req.user.id) {
      await prisma.notification.create({
        data: {
          user_id: video.user_id,
          title: 'New Comment',
          content: `${comment.user.username} commented on your video: ${video.title}`,
          type: 'NEW_COMMENT',
          video_id: video.id,
          from_user_id: req.user.id
        }
      });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a video
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const video_id = req.params.id as string;
    const user_id = req.user.id;

    const video = await prisma.video.findUnique({ where: { id: video_id } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const existingLike = await prisma.like.findUnique({ where: { user_id_video_id: { user_id, video_id } } });
    if (existingLike) {
      if (existingLike.type === 'LIKE') {
        await prisma.like.delete({ where: { id: existingLike.id } });
        res.json({ liked: false });
      } else {
        await prisma.like.update({ where: { id: existingLike.id }, data: { type: 'LIKE' } });
        res.json({ liked: true });
      }
    } else {
      await prisma.like.create({ data: { video_id, user_id, type: 'LIKE' } });

      // Notify Video Owner
      const currentUser = await prisma.user.findUnique({ where: { id: user_id }, select: { username: true } });
      if (video.user_id !== user_id) {
        await prisma.notification.create({
          data: {
            user_id: video.user_id,
            title: 'New Like',
            content: `${currentUser?.username} liked your video: ${video.title}`,
            type: 'NEW_LIKE',
            video_id: video.id,
            from_user_id: user_id
          }
        });
      }

      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit a video
router.put('/:id', authenticateToken, upload.single('thumbnail'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, category } = req.body;
    let { thumbnail_url } = req.body;

    const video = await prisma.video.findUnique({ where: { id: req.params.id as string } });
    if (!video || video.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    if (req.file) {
      const fileName = `thumb_${req.params.id}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
      thumbnail_url = data.publicUrl;
    }

    const updated = await prisma.video.update({
      where: { id: req.params.id as string },
      data: {
        title,
        description,
        category,
        ...(thumbnail_url && { thumbnail_url })
      }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a video
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const video = await prisma.video.findUnique({ where: { id: req.params.id as string } });
    if (!video || video.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.video.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
