import type { TimemapEntry } from '../../types/score';

export interface RenderScoreRequest {
  type: 'render';
  requestId: string;
  name: string;
  format: 'xml' | 'mxl';
  data: string | ArrayBuffer;
}

export interface RenderScoreSuccess {
  type: 'rendered';
  requestId: string;
  name: string;
  pages: string[];
  midiBase64: string;
  timemap: TimemapEntry[];
}

export interface RenderScoreFailure {
  type: 'error';
  requestId: string;
  message: string;
}

export type VerovioWorkerRequest = RenderScoreRequest;
export type VerovioWorkerResponse = RenderScoreSuccess | RenderScoreFailure;
