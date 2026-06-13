import type { JobRepository } from './repository.js';
import type { RecognitionRunner } from '../audiveris/runner.js';

export class RecognitionQueue {
  private pending: string[] = [];
  private running = false;

  constructor(
    private readonly repository: JobRepository,
    private readonly runner: RecognitionRunner
  ) {}

  enqueue(jobId: string) {
    this.pending.push(jobId);
    void this.drain();
  }

  private async drain() {
    if (this.running) {
      return;
    }
    this.running = true;

    while (this.pending.length > 0) {
      const jobId = this.pending.shift()!;
      const job = await this.repository.get(jobId);
      if (!job) {
        continue;
      }

      await this.repository.update(jobId, { status: 'processing' });
      try {
        await this.runner.run(jobId);
        await this.repository.update(jobId, {
          status: 'completed',
          resultUrl: `/api/omr/jobs/${jobId}/result`,
          errorCode: undefined,
          errorMessage: undefined
        });
      } catch {
        await this.repository.update(jobId, {
          status: 'failed',
          errorCode: 'RECOGNITION_FAILED',
          errorMessage: 'The printed score could not be recognized. Try a cleaner scan or another PDF.'
        });
      }
    }

    this.running = false;
  }
}
