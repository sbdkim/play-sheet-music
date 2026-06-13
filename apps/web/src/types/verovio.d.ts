declare module 'verovio/wasm' {
  export default function createVerovioModule(): Promise<unknown>;
}

declare module 'verovio/esm' {
  export class VerovioToolkit {
    constructor(module: unknown);
    destroy(): void;
    getPageCount(): number;
    loadData(data: string): boolean;
    loadZipDataBuffer(data: ArrayBuffer): boolean;
    renderToMIDI(): string;
    renderToSVG(page: number, xmlDeclaration?: boolean): string;
    renderToTimemap(options?: { includeMeasures?: boolean; includeRests?: boolean }): TimemapEntry[];
    setOptions(options: Record<string, unknown>): boolean;
  }
}

interface TimemapEntry {
  tstamp: number;
  qstamp: number;
  tempo?: number;
  on?: string[];
  off?: string[];
}
