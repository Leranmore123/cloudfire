import { Router, Response } from 'express';
import { prisma } from '../../db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export const deviceRouter = Router();

deviceRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user!.id },
      include: {
        tunnels: { select: { id: true, name: true, subdomain: true, status: true } }
      },
      orderBy: { lastSeenAt: 'desc' }
    });

    res.json({ success: true, data: devices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

deviceRouter.post('/register', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { deviceIdentifier, name, platform, osVersion, agentVersion } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    if (!deviceIdentifier || !name) {
      res.status(400).json({ success: false, error: { code: 'DEVICE_DATA_REQUIRED', message: 'deviceIdentifier and name are required' } });
      return;
    }

    const device = await prisma.device.upsert({
      where: { deviceIdentifier },
      update: {
        name,
        platform,
        osVersion,
        agentVersion,
        ipAddress,
        isOnline: true,
        lastSeenAt: new Date()
      },
      create: {
        deviceIdentifier,
        name,
        platform,
        osVersion,
        agentVersion,
        ipAddress,
        isOnline: true,
        userId: req.user!.id,
        lastSeenAt: new Date()
      }
    });

    res.json({ success: true, data: device });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
