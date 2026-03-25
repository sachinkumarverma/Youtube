import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: { user: { select: { id: true, username: true } } },
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
        user: { select: { id: true, username: true } },
        comments: {
          include: { user: { select: { username: true } } },
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
    const { title, description, video_url, thumbnail_url } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const video = await prisma.video.create({
      data: {
        title,
        description,
        video_url,
        thumbnail_url,
        user_id: req.user.id
      }
    });
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

export default router;
