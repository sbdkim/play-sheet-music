import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import type { OmrJob } from '@play-sheet-music/contracts';
import type { ServiceConfig } from './config.js';
import { createRecognitionRunner, type RecognitionRunner } from './audiveris/runner.js';
import { cleanupExpiredJobs } from './cleanup/expiredJobs.js';
import { estimatePdfPageCount, isPdf } from './pdf.js';
import { RecognitionQueue } from './jobs/queue.js';
import { JobRepository } from './jobs/repository.js';

interface AppOverrides {
  repository?: JobRepository;
  runner?: RecognitionRunner;
}

function resultContentDisposition(pdfFileName: string) {
  const resultName = `${pdfFileName.replace(/\.pdf$/i, '')}.mxl`;
  const fallbackName = resultName
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(resultName)}`;
}

export async function createApp(config: ServiceConfig, overrides: AppOverrides = {}) {
  const app = Fastify({ logger: false });
  const repository = overrides.repository ?? new JobRepository(config.JOBS_ROOT);
  await repository.initialize();
  await cleanupExpiredJobs(repository);
  const runner = overrides.runner ?? createRecognitionRunner(config, repository);
  const queue = new RecognitionQueue(repository, runner);
  const origins = config.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());

  await app.register(cors, {
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    origin(origin, callback) {
      callback(null, !origin || origins.includes(origin));
    }
  });
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: config.MAX_PDF_BYTES
    }
  });

  app.get('/api/health', async () => ({
    status: 'ok',
    engine: runner.engine,
    ready: runner.ready,
    retentionHours: config.JOB_RETENTION_HOURS
  }));

  app.post('/api/omr/jobs', async (request, reply) => {
    if (!runner.ready) {
      return reply.code(503).send({
        errorCode: 'OMR_NOT_CONFIGURED',
        errorMessage: 'The local recognition engine is not configured.'
      });
    }

    let part;
    try {
      part = await request.file();
    } catch {
      return reply.code(413).send({
        errorCode: 'PDF_TOO_LARGE',
        errorMessage: 'PDFs must be 20 MB or smaller.'
      });
    }

    if (!part) {
      return reply.code(400).send({
        errorCode: 'PDF_REQUIRED',
        errorMessage: 'Attach one PDF using the score field.'
      });
    }
    if (part.fieldname !== 'score') {
      return reply.code(400).send({
        errorCode: 'INVALID_UPLOAD_FIELD',
        errorMessage: 'Attach the PDF using the score field.'
      });
    }

    const pdf = await part.toBuffer();
    if (!isPdf(pdf)) {
      return reply.code(415).send({
        errorCode: 'INVALID_PDF',
        errorMessage: 'The uploaded file is not a readable PDF.'
      });
    }
    const estimatedPages = estimatePdfPageCount(pdf);
    if (estimatedPages > config.MAX_PDF_PAGES) {
      return reply.code(422).send({
        errorCode: 'TOO_MANY_PAGES',
        errorMessage: `PDFs may contain at most ${config.MAX_PDF_PAGES} pages.`
      });
    }

    const now = new Date();
    const job: OmrJob = {
      jobId: randomUUID(),
      status: 'queued',
      fileName: part.filename || 'score.pdf',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + config.JOB_RETENTION_HOURS * 60 * 60 * 1000).toISOString()
    };
    await repository.create(job, pdf);
    queue.enqueue(job.jobId);
    return reply.code(202).send(job);
  });

  app.get<{ Params: { jobId: string } }>('/api/omr/jobs/:jobId', async (request, reply) => {
    const job = await repository.get(request.params.jobId);
    if (!job) {
      return reply.code(404).send({
        errorCode: 'JOB_NOT_FOUND',
        errorMessage: 'No recognition job was found.'
      });
    }
    if (Date.parse(job.expiresAt) <= Date.now()) {
      await repository.delete(job.jobId);
      return reply.code(410).send({
        errorCode: 'JOB_EXPIRED',
        errorMessage: 'This recognition job has expired.'
      });
    }
    return job;
  });

  app.get<{ Params: { jobId: string } }>('/api/omr/jobs/:jobId/result', async (request, reply) => {
    const job = await repository.get(request.params.jobId);
    if (!job) {
      return reply.code(404).send({
        errorCode: 'JOB_NOT_FOUND',
        errorMessage: 'No recognition job was found.'
      });
    }
    if (job.status !== 'completed') {
      return reply.code(409).send({
        errorCode: 'RESULT_NOT_READY',
        errorMessage: 'Recognition has not completed.'
      });
    }
    try {
      await access(repository.resultPath(job.jobId));
    } catch {
      return reply.code(500).send({
        errorCode: 'RESULT_MISSING',
        errorMessage: 'The recognized score file is missing.'
      });
    }
    reply.header('Content-Type', 'application/vnd.recordare.musicxml');
    reply.header('Content-Disposition', resultContentDisposition(job.fileName));
    return reply.send(createReadStream(repository.resultPath(job.jobId)));
  });

  app.delete<{ Params: { jobId: string } }>('/api/omr/jobs/:jobId', async (request, reply) => {
    const job = await repository.get(request.params.jobId);
    if (!job) {
      return reply.code(404).send({
        errorCode: 'JOB_NOT_FOUND',
        errorMessage: 'No recognition job was found.'
      });
    }
    await repository.delete(job.jobId);
    return reply.code(204).send();
  });

  return { app, repository, runner };
}
