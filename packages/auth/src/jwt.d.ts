export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    organizationId?: string;
    deviceId?: string;
}
export declare class JwtService {
    static signAccessToken(payload: TokenPayload, secret: string, expiresIn?: string | number): string;
    static signRefreshToken(payload: TokenPayload, secret: string, expiresIn?: string | number): string;
    static verifyToken<T = TokenPayload>(token: string, secret: string): T;
    static decodeToken<T = TokenPayload>(token: string): T | null;
}
//# sourceMappingURL=jwt.d.ts.map