import { Router, Response } from 'express';
import { prisma } from '../../db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { ApiKeyService } from '@turnal/auth';

export const apiKeyRouter = Router();

apiKeyRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: keys });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

apiKeyRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, expiresInDays } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: { code: 'NAME_REQUIRED', message: 'Key name is required' } });
      return;
    }

    const { apiKey, keyPrefix, hash } = ApiKeyService.generateApiKey();

    let expiresAt: Date | undefined;
    if (expiresInDays && parseInt(expiresInDays, 10) > 0) {
      expiresAt = new Date(Date.now() + parseInt(expiresInDays, 10) * 24 * 60 * 60 * 1000);
    }

    const record = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        keyHash: hash,
        keyPrefix,
        expiresAt,
        userId: req.user!.id
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: record.id,
        name: record.name,
        apiKey,
        keyPrefix: record.keyPrefix,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
        warning: 'Make sure to copy your API key now as you will not be able to see it again.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

apiKeyRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!key) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } });
      return;
    }

    await prisma.apiKey.delete({ where: { id: key.id } });
    res.json({ success: true, data: { message: 'API key revoked' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
