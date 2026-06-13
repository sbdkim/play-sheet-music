import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { OmrJob } from '@play-sheet-music/contracts';

const METADATA_FILE = 'metadata.json';

export class JobRepository {
  constructor(private readonly root: string) {}

  async initialize() {
    await mkdir(this.root, { recursive: true });
  }

  directory(jobId: string) {
    return path.join(this.root, jobId);
  }

  sourcePath(jobId: string) {
    return path.join(this.directory(jobId), 'source.pdf');
  }

  rasterizedSourcePath(jobId: string) {
    return path.join(this.directory(jobId), 'source-400dpi.tiff');
  }

  resultPath(jobId: string) {
    return path.join(this.directory(jobId), 'output.mxl');
  }

  logPath(jobId: string) {
    return path.join(this.directory(jobId), 'process.log');
  }

  async create(job: OmrJob, pdf: Buffer) {
    const directory = this.directory(job.jobId);
    await mkdir(directory, { recursive: false });
    await writeFile(this.sourcePath(job.jobId), pdf);
    await this.save(job);
    return job;
  }

  async save(job: OmrJob) {
    await writeFile(
      path.join(this.directory(job.jobId), METADATA_FILE),
      JSON.stringify(job, null, 2),
      'utf8'
    );
    return job;
  }

  async get(jobId: string): Promise<OmrJob | null> {
    try {
      const content = await readFile(path.join(this.directory(jobId), METADATA_FILE), 'utf8');
      return JSON.parse(content) as OmrJob;
    } catch {
      return null;
    }
  }

  async list() {
    await this.initialize();
    const entries = await readdir(this.root, { withFileTypes: true });
    const jobs = await Promise.all(
      entries.filter((entry) => entry.isDirectory()).map((entry) => this.get(entry.name))
    );
    return jobs.filter((job): job is OmrJob => job !== null);
  }

  async update(jobId: string, patch: Partial<OmrJob>) {
    const current = await this.get(jobId);
    if (!current) {
      return null;
    }
    const next: OmrJob = {
      ...current,
      ...patch,
      jobId: current.jobId,
      updatedAt: new Date().toISOString()
    };
    return this.save(next);
  }

  async delete(jobId: string) {
    await rm(this.directory(jobId), { recursive: true, force: true });
  }
}
