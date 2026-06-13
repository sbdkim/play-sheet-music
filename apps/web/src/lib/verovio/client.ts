import { Midi } from '@tonejs/midi';
import type { RenderedScore } from '../../types/score';
import type { VerovioWorkerRequest, VerovioWorkerResponse } from './messages';

let worker: Worker | null = null;

function getWorker() {
  worker ??= new Worker(new URL('./verovio.worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

function decodeBase64(base64: string) {
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

export function renderScore(
  name: string,
  format: 'xml' | 'mxl',
  data: string | ArrayBuffer
): Promise<RenderedScore> {
  const requestId = crypto.randomUUID();
  const activeWorker = getWorker();

  return new Promise((resolve, reject) => {
    function handleMessage(event: MessageEvent<VerovioWorkerResponse>) {
      if (event.data.requestId !== requestId) {
        return;
      }

      activeWorker.removeEventListener('message', handleMessage);
      if (event.data.type === 'error') {
        reject(new Error(event.data.message));
        return;
      }

      const midi = new Midi(decodeBase64(event.data.midiBase64));
      resolve({
        name: event.data.name,
        pages: event.data.pages,
        midiBase64: event.data.midiBase64,
        timemap: event.data.timemap,
        durationSeconds: midi.duration,
        midi
      });
    }

    activeWorker.addEventListener('message', handleMessage);
    activeWorker.addEventListener('error', () => reject(new Error('The score renderer stopped unexpectedly.')), {
      once: true
    });

    const message: VerovioWorkerRequest = {
      type: 'render',
      requestId,
      name,
      format,
      data
    };
    activeWorker.postMessage(message, format === 'mxl' ? [data as ArrayBuffer] : []);
  });
}
