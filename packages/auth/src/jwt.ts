import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  deviceId?: string;
}

export class JwtService {
  public static signAccessToken(
    payload: TokenPayload,
    secret: string,
    expiresIn: string | number = '7d'
  ): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  public static signRefreshToken(
    payload: TokenPayload,
    secret: string,
    expiresIn: string | number = '30d'
  ): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  public static verifyToken<T = TokenPayload>(token: string, secret: string): T {
    return jwt.verify(token, secret) as T;
  }

  public static decodeToken<T = TokenPayload>(token: string): T | null {
    return jwt.decode(token) as T | null;
  }
}
