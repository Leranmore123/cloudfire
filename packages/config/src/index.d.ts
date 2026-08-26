export interface TurnalConfig {
    env: 'development' | 'production' | 'test';
    isDev: boolean;
    baseDomain: string;
    publicProtocol: 'http' | 'https';
    api: {
        port: number;
        host: string;
        url: string;
        jwtSecret: string;
        jwtExpiresIn: string;
        jwtRefreshSecret: string;
        jwtRefreshExpiresIn: string;
    };
    database: {
        url: string;
    };
    redis: {
        url?: string;
    };
    edge: {
        port: number;
        host: string;
        publicUrl: string;
        wsPath: string;
        wildcardDomain: string;
    };
    dashboard: {
        port: number;
    };
}
export declare function loadConfig(): TurnalConfig;
export declare const config: TurnalConfig;
//# sourceMappingURL=index.d.ts.map