import { Router, Response } from 'express';
import { prisma } from '../../db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export const projectRouter = Router();

projectRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      include: {
        tunnels: true,
        _count: { select: { tunnels: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = projects.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      tunnelCount: p._count.tunnels,
      tunnels: p.tunnels.map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        status: t.status,
        localTargetPort: t.localTargetPort
      })),
      createdAt: p.createdAt.toISOString()
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

projectRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: { code: 'NAME_REQUIRED', message: 'Project name is required' } });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
        description: description?.trim(),
        userId: req.user!.id
      }
    });

    res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

projectRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
      return;
    }

    await prisma.project.delete({ where: { id: project.id } });
    res.json({ success: true, data: { message: 'Project deleted successfully' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
