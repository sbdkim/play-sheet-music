import { copyFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { ServiceConfig } from '../config.js';
import type { JobRepository } from '../jobs/repository.js';

export interface RecognitionRunner {
  engine: 'audiveris' | 'fake';
  ready: boolean;
  run(jobId: string): Promise<void>;
}

async function findMxl(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true });
  const file = entries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.mxl'));
  return file ? path.join(directory, file.name) : null;
}

async function runCommand(command: string, cwd: string) {
  const output: Buffer[] = [];
  const errorOutput: Buffer[] = [];
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true
    });
    child.stdout.on('data', (chunk: Buffer) => output.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => errorOutput.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
  return {
    exitCode,
    output: Buffer.concat([...output, ...errorOutput])
  };
}

export function createRecognitionRunner(
  config: ServiceConfig,
  repository: JobRepository
): RecognitionRunner {
  if (config.OMR_FAKE_RESULT_PATH) {
    return {
      engine: 'fake',
      ready: true,
      async run(jobId) {
        await copyFile(config.OMR_FAKE_RESULT_PATH!, repository.resultPath(jobId));
        await writeFile(repository.logPath(jobId), 'Fake OMR adapter copied the configured result fixture.\n');
      }
    };
  }

  return {
    engine: 'audiveris',
    ready: Boolean(config.AUDIVERIS_COMMAND),
    async run(jobId) {
      if (!config.AUDIVERIS_COMMAND) {
        throw new Error('Audiveris is not configured. Set AUDIVERIS_COMMAND or OMR_FAKE_RESULT_PATH.');
      }

      const directory = repository.directory(jobId);
      let inputPath = repository.sourcePath(jobId);
      let preprocessingLog = Buffer.alloc(0);
      if (config.PDF_RASTERIZE_COMMAND) {
        const rasterizedPath = repository.rasterizedSourcePath(jobId);
        const rasterizeCommand = config.PDF_RASTERIZE_COMMAND
          .replaceAll('{input}', inputPath)
          .replaceAll('{output}', rasterizedPath);
        const rasterizeResult = await runCommand(rasterizeCommand, directory);
        preprocessingLog = rasterizeResult.output;
        if (rasterizeResult.exitCode !== 0) {
          await writeFile(repository.logPath(jobId), preprocessingLog);
          throw new Error(`PDF preprocessing exited with code ${rasterizeResult.exitCode}.`);
        }
        inputPath = rasterizedPath;
      }

      const command = config.AUDIVERIS_COMMAND
        .replaceAll('{input}', inputPath)
        .replaceAll('{outputDir}', directory);

      const recognitionResult = await runCommand(command, directory);

      await writeFile(
        repository.logPath(jobId),
        Buffer.concat([preprocessingLog, recognitionResult.output])
      );
      if (recognitionResult.exitCode !== 0) {
        throw new Error(`Audiveris exited with code ${recognitionResult.exitCode}.`);
      }

      const generated = await findMxl(directory);
      if (!generated) {
        throw new Error('Audiveris completed without producing an MXL file.');
      }
      if (generated !== repository.resultPath(jobId)) {
        await rename(generated, repository.resultPath(jobId));
      }
    }
  };
}
