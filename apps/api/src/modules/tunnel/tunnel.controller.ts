import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { config } from '@turnal/config';
import { TunnelStatus } from '@turnal/shared';

export const tunnelRouter = Router();

function generateRandomSubdomain(): string {
  const hex = crypto.randomBytes(4).toString('hex');
  return `tun-${hex}`;
}

tunnelRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tunnels = await prisma.tunnel.findMany({
      where: { userId: req.user!.id },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        connectedDevice: { select: { id: true, name: true, platform: true } },
        domains: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = tunnels.map(t => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      publicUrl: `${config.publicProtocol}://${t.subdomain}.${config.baseDomain}${config.edge.port !== 80 && config.edge.port !== 443 ? `:${config.edge.port}` : ''}`,
      customDomain: t.customDomain ? `${config.publicProtocol}://${t.customDomain}` : undefined,
      status: t.status,
      localTargetPort: t.localTargetPort,
      localTargetHost: t.localTargetHost,
      protocol: t.protocol,
      connectedDeviceId: t.connectedDeviceId,
      connectedDeviceName: t.connectedDevice?.name,
      createdAt: t.createdAt.toISOString(),
      lastHeartbeatAt: t.lastHeartbeatAt?.toISOString(),
      totalRequests: t.totalRequests,
      totalBytes: Number(t.totalBytes)
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

tunnelRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, subdomain, customDomain, localTargetPort = 3000, localTargetHost = 'localhost', protocol = 'http', projectId } = req.body;

    const chosenSubdomain = (subdomain || generateRandomSubdomain()).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

    if (chosenSubdomain.length < 3) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_SUBDOMAIN', message: 'Subdomain must be at least 3 characters alphanumeric' }
      });
      return;
    }

    const existingSubdomain = await prisma.tunnel.findUnique({
      where: { subdomain: chosenSubdomain }
    });

    if (existingSubdomain) {
      res.status(409).json({
        success: false,
        error: { code: 'SUBDOMAIN_TAKEN', message: `Subdomain '${chosenSubdomain}' is already in use` }
      });
      return;
    }

    const tunnel = await prisma.tunnel.create({
      data: {
        name: name || chosenSubdomain,
        subdomain: chosenSubdomain,
        customDomain: customDomain ? customDomain.toLowerCase().trim() : null,
        localTargetPort: parseInt(localTargetPort, 10),
        localTargetHost: localTargetHost.trim(),
        protocol,
        status: TunnelStatus.OFFLINE,
        userId: req.user!.id,
        projectId: projectId || null
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: tunnel.id,
        name: tunnel.name,
        subdomain: tunnel.subdomain,
        publicUrl: `${config.publicProtocol}://${tunnel.subdomain}.${config.baseDomain}${config.edge.port !== 80 && config.edge.port !== 443 ? `:${config.edge.port}` : ''}`,
        status: tunnel.status,
        localTargetPort: tunnel.localTargetPort,
        localTargetHost: tunnel.localTargetHost,
        protocol: tunnel.protocol
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

tunnelRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tunnel = await prisma.tunnel.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        project: true,
        connectedDevice: true,
        domains: true,
        requestLogs: {
          take: 50,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!tunnel) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tunnel not found' } });
      return;
    }

    res.json({ success: true, data: tunnel });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

tunnelRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tunnel = await prisma.tunnel.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!tunnel) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tunnel not found' } });
      return;
    }

    await prisma.tunnel.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Tunnel deleted successfully' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

tunnelRouter.post('/resolve-host', async (req, res): Promise<void> => {
  try {
    const { host } = req.body;
    if (!host) {
      res.status(400).json({ success: false, error: { code: 'HOST_REQUIRED', message: 'Host is required' } });
      return;
    }

    const cleanHost = host.split(':')[0].toLowerCase();
    
    let subdomainMatch: string | null = null;
    if (cleanHost.endsWith(`.${config.baseDomain}`)) {
      subdomainMatch = cleanHost.replace(`.${config.baseDomain}`, '');
    } else if (cleanHost.endsWith('.localhost')) {
      subdomainMatch = cleanHost.replace('.localhost', '');
    }

    let tunnel = null;
    if (subdomainMatch) {
      tunnel = await prisma.tunnel.findUnique({
        where: { subdomain: subdomainMatch },
        include: { user: { select: { id: true, email: true } } }
      });
    }

    if (!tunnel) {
      const domain = await prisma.domain.findUnique({
        where: { domainName: cleanHost },
        include: {
          targetTunnel: {
            include: { user: { select: { id: true, email: true } } }
          }
        }
      });
      if (domain && domain.targetTunnel) {
        tunnel = domain.targetTunnel;
      }
    }

    if (!tunnel) {
      res.status(404).json({
        success: false,
        error: { code: 'TUNNEL_NOT_FOUND', message: `No tunnel registered for host '${cleanHost}'` }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        tunnelId: tunnel.id,
        subdomain: tunnel.subdomain,
        customDomain: tunnel.customDomain,
        localTargetPort: tunnel.localTargetPort,
        localTargetHost: tunnel.localTargetHost,
        protocol: tunnel.protocol,
        status: tunnel.status,
        userId: tunnel.userId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
