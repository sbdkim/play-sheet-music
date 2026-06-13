import { useRef } from 'react';
import { UploadIcon } from '../../components/Icons';
import type { PdfPreview } from '../../types/score';

interface ImportPanelProps {
  busy: boolean;
  omrReady: boolean;
  pdfFile: File | null;
  pdfPreview: PdfPreview | null;
  onPdf: (file: File) => void;
  onRecognize: () => void;
  onScore: (file: File) => void;
  onSample: () => void;
}

export function ImportPanel(props: ImportPanelProps) {
  const scoreInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  return (
    <aside className="import-panel">
      <div className="panel-heading">
        <h2>Open a score</h2>
        <p>MusicXML stays in your browser. PDF recognition uses the local companion service.</p>
      </div>

      <button className="sample-button" type="button" onClick={props.onSample} disabled={props.busy}>
        Load demonstration score
      </button>

      <div className="file-choice">
        <h3>MusicXML or MXL</h3>
        <p>Best for immediate, accurate playback.</p>
        <button type="button" onClick={() => scoreInput.current?.click()} disabled={props.busy}>
          <UploadIcon /> Choose score file
        </button>
        <input
          ref={scoreInput}
          type="file"
          accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) props.onScore(file);
            event.target.value = '';
          }}
        />
      </div>

      <div className="file-choice">
        <div className="choice-title">
          <h3>Printed score PDF</h3>
          <span className={props.omrReady ? 'service-state ready' : 'service-state'}>
            {props.omrReady ? 'Local service ready' : 'Local service offline'}
          </span>
        </div>
        <p>For clean printed Western notation, up to 20 pages and 20 MB. Handwriting is not supported.</p>
        <button type="button" onClick={() => pdfInput.current?.click()} disabled={props.busy}>
          <UploadIcon /> Choose PDF
        </button>
        <input
          ref={pdfInput}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) props.onPdf(file);
            event.target.value = '';
          }}
        />
        {props.pdfPreview && props.pdfFile && (
          <div className="pdf-preview">
            <img src={props.pdfPreview.previewUrl} alt={`First page preview of ${props.pdfFile.name}`} />
            <div>
              <strong>{props.pdfFile.name}</strong>
              <span>{props.pdfPreview.pageCount} page{props.pdfPreview.pageCount === 1 ? '' : 's'}</span>
            </div>
            <button type="button" onClick={props.onRecognize} disabled={!props.omrReady || props.busy}>
              Recognize score
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
