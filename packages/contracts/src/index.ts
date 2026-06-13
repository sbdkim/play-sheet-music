export const OMR_JOB_STATUSES = [
  'queued',
  'processing',
  'completed',
  'failed',
  'expired'
] as const;

export type OmrJobStatus = (typeof OMR_JOB_STATUSES)[number];

export interface OmrJob {
  jobId: string;
  status: OmrJobStatus;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  errorCode?: string;
  errorMessage?: string;
  resultUrl?: string;
}

export interface OmrHealth {
  status: 'ok';
  engine: 'audiveris' | 'fake';
  ready: boolean;
  retentionHours: number;
}

export interface ApiError {
  errorCode: string;
  errorMessage: string;
}
