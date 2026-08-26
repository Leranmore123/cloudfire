import crypto from 'node:crypto';
import { API_KEY_PREFIX } from '@turnal/shared';

export class ApiKeyService {
  public static generateApiKey(): { apiKey: string; keyPrefix: string; hash: string } {
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `${API_KEY_PREFIX}${randomBytes}`;
    const keyPrefix = apiKey.substring(0, 16) + '...';
    const hash = this.hashApiKey(apiKey);

    return { apiKey, keyPrefix, hash };
  }

  public static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  public static generateDomainToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
