import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient() as any;

// Add comment
router.post('/videos/:id/comments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const comment = await prisma.comment.create({
      data: {
        content,
        video_id: req.params.id as string,
        user_id: req.user.id
      },
      include: { user: { select: { username: true } } }
    });
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle Like/Dislike
router.post('/videos/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body; // 'LIKE' or 'DISLIKE'
    const video_id = req.params.id as string;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user_id = req.user.id;

    // Check if interaction exists
    const existing = await prisma.like.findUnique({
      where: { user_id_video_id: { user_id, video_id } }
    });

    if (existing) {
      if (existing.type === type) {
        // Toggle off if same type
        await prisma.like.delete({ where: { id: existing.id } });
        return res.json({ removed: true });
      } else {
        // Update type (e.g. from LIKE to DISLIKE)
        const updated = await prisma.like.update({
          where: { id: existing.id },
          data: { type }
        });
        return res.json(updated);
      }
    } else {
      // Create new interaction
      const newLike = await prisma.like.create({
        data: { user_id, video_id, type }
      });
      return res.status(201).json(newLike);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
