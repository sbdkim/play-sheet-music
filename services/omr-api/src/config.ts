import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const serviceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const schema = z.object({
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(8787),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  JOBS_ROOT: z.string().default(path.join(serviceRoot, 'data', 'jobs')),
  JOB_RETENTION_HOURS: z.coerce.number().positive().default(24),
  MAX_PDF_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),
  MAX_PDF_PAGES: z.coerce.number().int().positive().default(20),
  PDF_RASTERIZE_COMMAND: z.string().optional(),
  AUDIVERIS_COMMAND: z.string().optional(),
  OMR_FAKE_RESULT_PATH: z.string().optional()
});

export type ServiceConfig = z.infer<typeof schema>;

export function loadConfig(overrides: Partial<NodeJS.ProcessEnv> = {}): ServiceConfig {
  return schema.parse({ ...process.env, ...overrides });
}
