import type { JobRepository } from '../jobs/repository.js';

export async function cleanupExpiredJobs(repository: JobRepository, now = Date.now()) {
  const jobs = await repository.list();
  let deleted = 0;
  for (const job of jobs) {
    if (Date.parse(job.expiresAt) <= now) {
      await repository.delete(job.jobId);
      deleted += 1;
    }
  }
  return deleted;
}

export function startCleanupTimer(repository: JobRepository) {
  const timer = setInterval(() => {
    void cleanupExpiredJobs(repository);
  }, 60 * 60 * 1000);
  timer.unref();
  return timer;
}
