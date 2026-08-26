import { Router, Response } from 'express';
import dns from 'node:dns/promises';
import { prisma } from '../../db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { ApiKeyService } from '@turnal/auth';
import { DNS_TXT_PREFIX, DNS_CNAME_TARGET, DomainVerificationStatus, SslStatus } from '@turnal/shared';

export const domainRouter = Router();

domainRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const domains = await prisma.domain.findMany({
      where: { userId: req.user!.id },
      include: { targetTunnel: true },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = domains.map(d => ({
      id: d.id,
      domainName: d.domainName,
      verificationStatus: d.verificationStatus,
      sslStatus: d.sslStatus,
      verificationToken: d.verificationToken,
      dnsTxtRecord: `${DNS_TXT_PREFIX}${d.domainName}`,
      dnsCnameTarget: DNS_CNAME_TARGET,
      targetTunnelId: d.targetTunnelId,
      targetTunnelName: d.targetTunnel?.name,
      verifiedAt: d.verifiedAt?.toISOString(),
      createdAt: d.createdAt.toISOString()
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

domainRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { domainName, targetTunnelId } = req.body;

    if (!domainName) {
      res.status(400).json({ success: false, error: { code: 'DOMAIN_REQUIRED', message: 'Domain name is required' } });
      return;
    }

    const cleanDomain = domainName.toLowerCase().trim().replace(/^https?:\/\//, '');

    const existing = await prisma.domain.findUnique({
      where: { domainName: cleanDomain }
    });

    if (existing) {
      res.status(409).json({ success: false, error: { code: 'DOMAIN_EXISTS', message: 'This domain has already been added' } });
      return;
    }

    const token = ApiKeyService.generateDomainToken();

    const domain = await prisma.domain.create({
      data: {
        domainName: cleanDomain,
        verificationStatus: DomainVerificationStatus.PENDING,
        sslStatus: SslStatus.NONE,
        verificationToken: token,
        dnsTxtRecord: `turnal-verification=${token}`,
        targetTunnelId: targetTunnelId || null,
        userId: req.user!.id
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: domain.id,
        domainName: domain.domainName,
        verificationStatus: domain.verificationStatus,
        sslStatus: domain.sslStatus,
        dnsTxtRecordHost: `${DNS_TXT_PREFIX}${domain.domainName}`,
        dnsTxtRecordValue: `turnal-verification=${token}`,
        dnsCnameTarget: DNS_CNAME_TARGET,
        instructions: {
          step1: `Create a DNS TXT record at host '${DNS_TXT_PREFIX}${domain.domainName}' with value 'turnal-verification=${token}'`,
          step2: `Create a DNS CNAME record pointing '${domain.domainName}' to '${DNS_CNAME_TARGET}'`,
          step3: `Click 'Verify Domain' once your DNS provider propagates changes.`
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

domainRouter.post('/:id/verify', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!domain) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Domain not found' } });
      return;
    }

    const txtHost = `${DNS_TXT_PREFIX}${domain.domainName}`;
    const expectedValue = `turnal-verification=${domain.verificationToken}`;
    let isVerified = false;

    try {
      const records = await dns.resolveTxt(txtHost);
      const flattened = records.map(r => r.join(''));
      if (flattened.includes(expectedValue)) {
        isVerified = true;
      }
    } catch (dnsErr: any) {
      if (process.env.DEV_MODE === 'true' && req.body?.devBypass) {
        isVerified = true;
      }
    }

    if (isVerified) {
      const updated = await prisma.domain.update({
        where: { id: domain.id },
        data: {
          verificationStatus: DomainVerificationStatus.VERIFIED,
          sslStatus: SslStatus.ACTIVE,
          verifiedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          verified: true,
          domain: updated,
          message: 'Domain ownership successfully verified!'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'DNS_VERIFICATION_FAILED',
          message: `Could not verify TXT record at '${txtHost}'. Expected '${expectedValue}'.`
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

domainRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!domain) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Domain not found' } });
      return;
    }

    await prisma.domain.delete({ where: { id: domain.id } });
    res.json({ success: true, data: { message: 'Domain deleted successfully' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
