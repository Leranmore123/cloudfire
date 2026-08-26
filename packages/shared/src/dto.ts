import { TunnelStatus, DomainVerificationStatus, SslStatus } from './types.js';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface CreateTunnelDto {
  name: string;
  subdomain?: string;
  customDomain?: string;
  localTargetPort: number;
  localTargetHost?: string;
  protocol?: 'http' | 'https';
  projectId?: string;
}

export interface CreateDomainDto {
  domainName: string;
  targetTunnelId?: string;
}

export interface CreateApiKeyDto {
  name: string;
  expiresInDays?: number;
}

export interface CreateProjectDto {
  name: string;
  slug?: string;
  defaultPort: number;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
