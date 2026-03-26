import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient() as any;

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const notifications = await prisma.notification.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        await prisma.notification.updateMany({
            where: { id: id as string, user_id: req.user.id },
            data: { is_read: true }
        });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        await prisma.notification.updateMany({
            where: { user_id: req.user.id, is_read: false },
            data: { is_read: true }
        });
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        await prisma.notification.deleteMany({
            where: { id: id as string, user_id: req.user.id }
        });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;
