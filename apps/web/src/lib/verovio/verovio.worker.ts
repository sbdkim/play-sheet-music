/// <reference lib="webworker" />

import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import type { VerovioWorkerRequest, VerovioWorkerResponse } from './messages';

const scope = self as DedicatedWorkerGlobalScope;
const toolkitPromise = createVerovioModule().then((module) => new VerovioToolkit(module));

scope.onmessage = async (event: MessageEvent<VerovioWorkerRequest>) => {
  const request = event.data;

  try {
    const toolkit = await toolkitPromise;
    toolkit.setOptions({
      adjustPageHeight: true,
      breaks: 'auto',
      footer: 'none',
      header: 'none',
      pageHeight: 2200,
      pageWidth: 1400,
      scale: 44,
      svgViewBox: true
    });

    const loaded = request.format === 'mxl'
      ? toolkit.loadZipDataBuffer(request.data as ArrayBuffer)
      : toolkit.loadData(request.data as string);

    if (!loaded) {
      throw new Error('Verovio could not read this score. Check that the file contains valid MusicXML.');
    }

    const pageCount = toolkit.getPageCount();
    const pages = Array.from({ length: pageCount }, (_, index) =>
      toolkit.renderToSVG(index + 1, false)
    );

    const response: VerovioWorkerResponse = {
      type: 'rendered',
      requestId: request.requestId,
      name: request.name,
      pages,
      midiBase64: toolkit.renderToMIDI(),
      timemap: toolkit.renderToTimemap({ includeMeasures: true })
    };
    scope.postMessage(response);
  } catch (error) {
    const response: VerovioWorkerResponse = {
      type: 'error',
      requestId: request.requestId,
      message: error instanceof Error ? error.message : 'The score could not be rendered.'
    };
    scope.postMessage(response);
  }
};
