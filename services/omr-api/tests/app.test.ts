import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { RecognitionRunner } from '../src/audiveris/runner.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { JobRepository } from '../src/jobs/repository.js';

const workspaces: string[] = [];

async function createTestApp(options: { failRecognition?: boolean } = {}) {
  const jobsRoot = await mkdtemp(path.join(tmpdir(), 'play-sheet-music-'));
  workspaces.push(jobsRoot);
  const repository = new JobRepository(jobsRoot);
  const runner: RecognitionRunner = {
    engine: 'fake',
    ready: true,
    async run(jobId) {
      if (options.failRecognition) {
        throw new Error('simulated recognition failure');
      }
      await copyFile(repository.sourcePath(jobId), repository.resultPath(jobId));
      await writeFile(repository.logPath(jobId), 'fake recognition complete\n');
    }
  };
  const config = loadConfig({
    JOBS_ROOT: jobsRoot,
    JOB_RETENTION_HOURS: '24',
    MAX_PDF_BYTES: String(20 * 1024 * 1024),
    MAX_PDF_PAGES: '20'
  });
  return createApp(config, { repository, runner });
}

function samplePdf() {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n2 0 obj\n<< /Type /Page >>\nendobj\n%%EOF'
  );
}

function multipartPdf(pdf: Buffer, filename = 'score.pdf') {
  const boundary = '----play-sheet-music-test';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="score"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`
    ),
    pdf,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
  return { boundary, body };
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe('OMR API', () => {
  it('reports readiness and retention policy', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      engine: 'fake',
      ready: true,
      retentionHours: 24
    });
    await app.close();
  });

  it('permits local frontend deletion requests through CORS', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/omr/jobs/example',
      headers: {
        origin: 'http://127.0.0.1:5173',
        'access-control-request-method': 'DELETE'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('DELETE');
    await app.close();
  });

  it('rejects a non-PDF upload', async () => {
    const { app } = await createTestApp();
    const upload = multipartPdf(Buffer.from('plain text'));
    const response = await app.inject({
      method: 'POST',
      url: '/api/omr/jobs',
      payload: upload.body,
      headers: { 'content-type': `multipart/form-data; boundary=${upload.boundary}` }
    });

    expect(response.statusCode).toBe(415);
    expect(response.json()).toMatchObject({ errorCode: 'INVALID_PDF' });
    await app.close();
  });

  it('processes a PDF and exposes its result', async () => {
    const { app } = await createTestApp();
    const upload = multipartPdf(samplePdf(), '주와 같이 길 가는 것.pdf');
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/omr/jobs',
      payload: upload.body,
      headers: { 'content-type': `multipart/form-data; boundary=${upload.boundary}` }
    });

    expect(createResponse.statusCode).toBe(202);
    const created = createResponse.json();
    let completed = created;
    for (let attempt = 0; attempt < 30 && completed.status !== 'completed'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      completed = (
        await app.inject({ method: 'GET', url: `/api/omr/jobs/${created.jobId}` })
      ).json();
    }
    expect(completed.status).toBe('completed');

    const result = await app.inject({
      method: 'GET',
      url: `/api/omr/jobs/${created.jobId}/result`
    });
    expect(result.statusCode).toBe(200);
    expect(result.rawPayload.subarray(0, 4).toString()).toBe('%PDF');
    expect(result.headers['content-disposition']).toContain("filename*=UTF-8''");
    expect(result.headers['content-disposition']).toContain(
      encodeURIComponent('주와 같이 길 가는 것.mxl')
    );
    await app.close();
  });

  it('reports a stable user-safe recognition failure', async () => {
    const { app } = await createTestApp({ failRecognition: true });
    const upload = multipartPdf(samplePdf());
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/omr/jobs',
        payload: upload.body,
        headers: { 'content-type': `multipart/form-data; boundary=${upload.boundary}` }
      })
    ).json();

    let failed = created;
    for (let attempt = 0; attempt < 30 && failed.status !== 'failed'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      failed = (
        await app.inject({ method: 'GET', url: `/api/omr/jobs/${created.jobId}` })
      ).json();
    }
    expect(failed).toMatchObject({
      status: 'failed',
      errorCode: 'RECOGNITION_FAILED'
    });
    expect(failed.errorMessage).not.toContain('simulated');
    await app.close();
  });

  it('deletes a job and its local files', async () => {
    const { app, repository } = await createTestApp();
    const upload = multipartPdf(samplePdf());
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/omr/jobs',
        payload: upload.body,
        headers: { 'content-type': `multipart/form-data; boundary=${upload.boundary}` }
      })
    ).json();

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/omr/jobs/${created.jobId}`
    });
    expect(response.statusCode).toBe(204);
    expect(await repository.get(created.jobId)).toBeNull();
    await app.close();
  });

  it('expires stale jobs on access', async () => {
    const { app, repository } = await createTestApp();
    const upload = multipartPdf(samplePdf());
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/omr/jobs',
        payload: upload.body,
        headers: { 'content-type': `multipart/form-data; boundary=${upload.boundary}` }
      })
    ).json();
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const current = await repository.get(created.jobId);
      if (current?.status === 'completed') break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await repository.update(created.jobId, {
      expiresAt: new Date(Date.now() - 1_000).toISOString()
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/omr/jobs/${created.jobId}`
    });
    expect(response.statusCode).toBe(410);
    expect(response.json()).toMatchObject({ errorCode: 'JOB_EXPIRED' });
    expect(await repository.get(created.jobId)).toBeNull();
    await app.close();
  });
});
