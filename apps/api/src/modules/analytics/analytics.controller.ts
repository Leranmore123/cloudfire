import { Router, Response, Request } from 'express';
import { prisma } from '../../db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { TunnelStatus } from '@turnal/shared';

export const analyticsRouter = Router();

analyticsRouter.get('/overview', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const userTunnels = await prisma.tunnel.findMany({
      where: { userId },
      select: { id: true, status: true, totalRequests: true, totalBytes: true }
    });

    const tunnelIds = userTunnels.map(t => t.id);

    const activeTunnelsCount = userTunnels.filter(t => t.status === TunnelStatus.ONLINE).length;
    const onlineDevicesCount = await prisma.device.count({
      where: { userId, isOnline: true }
    });

    const todayLogs = await prisma.requestLog.findMany({
      where: {
        tunnelId: { in: tunnelIds },
        timestamp: { gte: startOfDay }
      }
    });

    const totalRequestsToday = todayLogs.length;
    const totalBandwidthBytes = todayLogs.reduce((acc, l) => acc + l.bytesIn + l.bytesOut, 0);
    const avgLatencyMs = totalRequestsToday > 0
      ? Math.round(todayLogs.reduce((acc, l) => acc + l.durationMs, 0) / totalRequestsToday)
      : 0;

    const errorCount = todayLogs.filter(l => l.statusCode >= 400).length;
    const errorRatePercent = totalRequestsToday > 0
      ? Number(((errorCount / totalRequestsToday) * 100).toFixed(1))
      : 0;

    const buckets: Record<string, { requests: number; errors: number; totalDuration: number }> = {};
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getTime() - (23 - i) * 3600 * 1000);
      const key = `${d.getHours().toString().padStart(2, '0')}:00`;
      buckets[key] = { requests: 0, errors: 0, totalDuration: 0 };
    }

    for (const log of todayLogs) {
      const key = `${log.timestamp.getHours().toString().padStart(2, '0')}:00`;
      if (buckets[key]) {
        buckets[key].requests += 1;
        if (log.statusCode >= 400) buckets[key].errors += 1;
        buckets[key].totalDuration += log.durationMs;
      }
    }

    const requestsTimeline = Object.entries(buckets).map(([timestamp, data]) => ({
      timestamp,
      requests: data.requests,
      errors: data.errors,
      avgLatencyMs: data.requests > 0 ? Math.round(data.totalDuration / data.requests) : 0
    }));

    res.json({
      success: true,
      data: {
        totalRequestsToday,
        totalBandwidthBytes,
        avgLatencyMs,
        errorRatePercent,
        activeTunnelsCount,
        onlineDevicesCount,
        totalTunnelsCount: userTunnels.length,
        requestsTimeline
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

analyticsRouter.get('/logs', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userTunnels = await prisma.tunnel.findMany({
      where: { userId: req.user!.id },
      select: { id: true, name: true, subdomain: true }
    });

    const tunnelMap = new Map(userTunnels.map(t => [t.id, t]));
    const tunnelIds = userTunnels.map(t => t.id);

    const logs = await prisma.requestLog.findMany({
      where: { tunnelId: { in: tunnelIds } },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    const formatted = logs.map(l => ({
      id: l.id,
      requestId: l.requestId,
      tunnelId: l.tunnelId,
      tunnelName: tunnelMap.get(l.tunnelId)?.name || 'Unknown',
      subdomain: tunnelMap.get(l.tunnelId)?.subdomain || '',
      method: l.method,
      path: l.path,
      statusCode: l.statusCode,
      durationMs: l.durationMs,
      bytesIn: l.bytesIn,
      bytesOut: l.bytesOut,
      clientIp: l.clientIp,
      userAgent: l.userAgent,
      timestamp: l.timestamp.toISOString()
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

analyticsRouter.post('/ingest-log', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tunnelId, requestId, method, path, statusCode, durationMs, bytesIn = 0, bytesOut = 0, clientIp, userAgent } = req.body;

    if (!tunnelId || !requestId) {
      res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: 'tunnelId and requestId are required' } });
      return;
    }

    await prisma.$transaction([
      prisma.requestLog.create({
        data: {
          tunnelId,
          requestId,
          method: method || 'GET',
          path: path || '/',
          statusCode: statusCode || 200,
          durationMs: durationMs || 0,
          bytesIn: bytesIn || 0,
          bytesOut: bytesOut || 0,
          clientIp,
          userAgent
        }
      }),
      prisma.tunnel.update({
        where: { id: tunnelId },
        data: {
          totalRequests: { increment: 1 },
          totalBytes: { increment: BigInt((bytesIn || 0) + (bytesOut || 0)) },
          lastHeartbeatAt: new Date()
        }
      })
    ]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
