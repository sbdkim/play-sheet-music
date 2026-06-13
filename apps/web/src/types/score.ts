import type { Midi } from '@tonejs/midi';

export interface TimemapEntry {
  tstamp: number;
  qstamp: number;
  tempo?: number;
  on?: string[];
  off?: string[];
}

export interface RenderedScore {
  name: string;
  pages: string[];
  midiBase64: string;
  timemap: TimemapEntry[];
  durationSeconds: number;
  midi: Midi;
}

export type ImportKind = 'sample' | 'musicxml' | 'mxl' | 'pdf';

export interface ScoreSource {
  name: string;
  kind: ImportKind;
}

export interface PdfPreview {
  pageCount: number;
  previewUrl: string;
}
