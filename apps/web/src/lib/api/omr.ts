import type { OmrHealth, OmrJob } from '@play-sheet-music/contracts';

const configuredBase = import.meta.env.VITE_OMR_API_URL as string | undefined;
export const OMR_API_BASE = configuredBase?.replace(/\/$/, '') ?? 'http://127.0.0.1:8787';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${OMR_API_BASE}${path}`, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.errorMessage ?? 'The local recognition service returned an error.');
  }
  return payload as T;
}

export async function getOmrHealth(signal?: AbortSignal) {
  return request<OmrHealth>('/api/health', { signal });
}

export async function createOmrJob(file: File) {
  const form = new FormData();
  form.append('score', file);
  return request<OmrJob>('/api/omr/jobs', { method: 'POST', body: form });
}

export async function getOmrJob(jobId: string) {
  return request<OmrJob>(`/api/omr/jobs/${jobId}`);
}

export async function downloadOmrResult(jobId: string) {
  const response = await fetch(`${OMR_API_BASE}/api/omr/jobs/${jobId}/result`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.errorMessage ?? 'The recognized score could not be downloaded.');
  }
  return response.blob();
}

export async function deleteOmrJob(jobId: string) {
  const response = await fetch(`${OMR_API_BASE}/api/omr/jobs/${jobId}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error('The local recognition job could not be removed.');
  }
}
