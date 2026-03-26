import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient() as any;

const selectUser = {
  id: true, username: true, email: true, avatar_url: true,
  banner_url: true, about: true, created_at: true,
  username_updated_at: true
};

router.post('/register', async (req: any, res: any) => {
  try {
    const { username, email, password, avatar_url } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { username, email, password_hash, avatar_url },
      select: selectUser
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    const userForRes = await prisma.user.findUnique({
      where: { id: user.id },
      select: selectUser
    });

    res.json({ token, user: userForRes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/google', async (req: any, res: any) => {
  try {
    const { email, username, avatar_url } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const password_hash = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: { username, email, password_hash, avatar_url }
      });
    } else if (avatar_url && !user.avatar_url) {
      user = await prisma.user.update({
        where: { email },
        data: { avatar_url }
      });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const userForRes = await prisma.user.findUnique({
      where: { id: user.id },
      select: selectUser
    });
    res.json({ token, user: userForRes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { avatar_url, banner_url, about, username } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const oldUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!oldUser) return res.status(404).json({ error: 'User not found' });

    if (username && username !== oldUser.username) {
      const lastUpdated = oldUser.username_updated_at;
      const diff = Date.now() - (lastUpdated ? new Date(lastUpdated).getTime() : 0);
      const days = diff / (1000 * 60 * 60 * 24);
      if (days < 30) {
        return res.status(400).json({
          error: `Username can only be changed once every 30 days. Please wait ${Math.ceil(30 - days)} more days.`
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(avatar_url && { avatar_url }),
        ...(banner_url && { banner_url }),
        ...(about !== undefined && { about }),
        ...(username && { username, username_updated_at: new Date() })
      },
      select: selectUser
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
