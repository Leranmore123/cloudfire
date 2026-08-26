export declare class ApiKeyService {
    /**
     * Generates a new cryptographically secure API key with prefix
     * e.g. trk_live_9f83a... (48 hex chars)
     */
    static generateApiKey(): {
        apiKey: string;
        keyPrefix: string;
        hash: string;
    };
    /**
     * Secure SHA-256 hash for database storage & lookup
     */
    static hashApiKey(apiKey: string): string;
    /**
     * Generates a random DNS verification token
     */
    static generateDomainToken(): string;
}
//# sourceMappingURL=apikey.d.ts.map