export interface FileUploadRequest {
  file: Express.Multer.File;
  userId?: string;
}

export interface FileUploadResponse {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: string;
  uploadedAt: string;
}

export interface SanitizationResult {
  success: boolean;
  sanitizedPath?: string;
  threats: ThreatInfo[];
  processingTime: number;
}

export interface ThreatInfo {
  type: string;
  severity: string;
  description: string;
  location?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    storage: 'available' | 'unavailable';
  };
}