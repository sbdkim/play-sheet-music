import { useCallback, useEffect, useState } from 'react';
import type { OmrJob } from '@play-sheet-music/contracts';
import { MoonIcon, SunIcon } from './components/Icons';
import { ImportPanel } from './features/file-import/ImportPanel';
import { Transport } from './features/playback/Transport';
import { ScoreViewer } from './features/score-viewer/ScoreViewer';
import { ScorePlayer } from './lib/audio/player';
import { createOmrJob, deleteOmrJob, downloadOmrResult, getOmrHealth, getOmrJob } from './lib/api/omr';
import { inspectPdf } from './lib/pdf';
import { isSupportedScoreFile, readScoreFile, validateScoreXml } from './lib/scoreFiles';
import { renderScore } from './lib/verovio/client';
import type { PdfPreview, RenderedScore, ScoreSource } from './types/score';

const THEME_KEY = 'northline-theme';

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [score, setScore] = useState<RenderedScore | null>(null);
  const [source, setSource] = useState<ScoreSource | null>(null);
  const [busyMessage, setBusyMessage] = useState<string | null>('Loading demonstration score...');
  const [notice, setNotice] = useState('Preparing the score renderer.');
  const [error, setError] = useState<string | null>(null);
  const [omrReady, setOmrReady] = useState(false);
  const [omrJob, setOmrJob] = useState<OmrJob | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfPreview | null>(null);
  const [playing, setPlaying] = useState(false);
  const [followScore, setFollowScore] = useState(true);
  const [position, setPosition] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [volume, setVolume] = useState(-8);
  const [muted, setMuted] = useState(false);
  const [player] = useState(() => (
    new ScorePlayer({
      onEnded: () => {
        setPlaying(false);
        setPosition(0);
      }
    })
  ));

  const loadScore = useCallback(async (
    name: string,
    kind: ScoreSource['kind'],
    format: 'xml' | 'mxl',
    data: string | ArrayBuffer
  ) => {
    setError(null);
    setBusyMessage(`Engraving ${name}...`);
    setNotice('Verovio is preparing notation, timing, and MIDI.');
    try {
      if (format === 'xml') {
        validateScoreXml(data as string);
      }
      const rendered = await renderScore(name, format, data);
      setScore(rendered);
      setSource({ name, kind });
      player.setMidi(rendered.midi);
      setPosition(0);
      setPlaying(false);
      setNotice(
        kind === 'pdf'
          ? `${rendered.pages.length} page${rendered.pages.length === 1 ? '' : 's'} ready. Recognition can misread rhythm; compare it with the original.`
          : `${rendered.pages.length} page${rendered.pages.length === 1 ? '' : 's'} ready to play.`
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The score could not be loaded.');
      setNotice('Choose another score or try the demonstration.');
    } finally {
      setBusyMessage(null);
    }
  }, [player]);

  const loadSample = useCallback(async () => {
    setBusyMessage('Loading demonstration score...');
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}samples/simple-scale.musicxml`);
      if (!response.ok) throw new Error('The bundled demonstration score is unavailable.');
      await loadScore('Simple Scale', 'sample', 'xml', await response.text());
    } catch (sampleError) {
      setError(sampleError instanceof Error ? sampleError.message : 'The sample could not be loaded.');
      setBusyMessage(null);
    }
  }, [loadScore]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    getOmrHealth(controller.signal)
      .then((health) => setOmrReady(health.ready))
      .catch(() => setOmrReady(false));
    const sampleTimer = window.setTimeout(() => void loadSample(), 0);
    return () => {
      controller.abort();
      window.clearTimeout(sampleTimer);
    };
  }, [loadSample]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPosition(player.getPosition());
    }, 50);
    return () => window.clearInterval(timer);
  }, [player, playing]);

  useEffect(() => () => player.dispose(), [player]);

  useEffect(() => {
    if (!omrJob || !['queued', 'processing'].includes(omrJob.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const next = await getOmrJob(omrJob.jobId);
        setOmrJob(next);
        setNotice(next.status === 'processing' ? 'Audiveris is reading the printed score.' : 'Recognition is queued.');
        if (next.status === 'completed') {
          const result = await downloadOmrResult(next.jobId);
          await loadScore(pdfFile?.name.replace(/\.pdf$/i, '') ?? 'Recognized score', 'pdf', 'mxl', await result.arrayBuffer());
        } else if (next.status === 'failed') {
          setBusyMessage(null);
          setError(next.errorMessage ?? 'Recognition did not complete.');
        }
      } catch (pollError) {
        setBusyMessage(null);
        setError(pollError instanceof Error ? pollError.message : 'Recognition status could not be refreshed.');
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [loadScore, omrJob, pdfFile]);

  async function handleScoreFile(file: File) {
    if (!isSupportedScoreFile(file)) {
      setError('Choose a .musicxml, .xml, or .mxl score.');
      return;
    }
    const input = await readScoreFile(file);
    await loadScore(file.name, input.format === 'mxl' ? 'mxl' : 'musicxml', input.format, input.data);
  }

  async function handlePdf(file: File) {
    setError(null);
    setBusyMessage(`Inspecting ${file.name}...`);
    try {
      const preview = await inspectPdf(file);
      setPdfFile(file);
      setPdfPreview(preview);
      setNotice(`${preview.pageCount} page PDF ready. Recognition stays on your local service.`);
    } catch (pdfError) {
      setPdfFile(null);
      setPdfPreview(null);
      setError(pdfError instanceof Error ? pdfError.message : 'The PDF could not be opened.');
    } finally {
      setBusyMessage(null);
    }
  }

  async function recognizePdf() {
    if (!pdfFile) return;
    setError(null);
    setBusyMessage('Submitting PDF to the local recognition service...');
    try {
      const job = await createOmrJob(pdfFile);
      setOmrJob(job);
      setNotice('Recognition queued. Keep this page open.');
    } catch (jobError) {
      setBusyMessage(null);
      setError(jobError instanceof Error ? jobError.message : 'The PDF could not be submitted.');
    }
  }

  async function togglePlayback() {
    if (!score) return;
    if (playing) {
      player.pause();
      setPlaying(false);
      setPosition(player.getPosition());
    } else {
      await player.play();
      setPlaying(true);
    }
  }

  function stopPlayback() {
    player.stop();
    setPlaying(false);
    setPosition(0);
  }

  async function clearOmrJob() {
    if (omrJob) {
      await deleteOmrJob(omrJob.jobId).catch(() => undefined);
    }
    setOmrJob(null);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <a className="wordmark" href={import.meta.env.BASE_URL}>Play Sheet Music</a>
          <span className="header-context">Browser score workspace</span>
        </div>
        <div className="header-actions">
          {source && <span className="current-file" title={source.name}>{source.name}</span>}
          <button className="icon-button" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      <div className="workspace">
        <ImportPanel
          busy={Boolean(busyMessage)}
          omrReady={omrReady}
          pdfFile={pdfFile}
          pdfPreview={pdfPreview}
          onPdf={handlePdf}
          onRecognize={recognizePdf}
          onSample={loadSample}
          onScore={handleScoreFile}
        />

        <main className="score-workspace">
          <div className="workspace-status" role="status" aria-live="polite">
            <div>
              <h1>{score?.name ?? 'No score loaded'}</h1>
              <p>{busyMessage ?? notice}</p>
            </div>
            {omrJob && (
              <button type="button" className="text-button" onClick={clearOmrJob}>
                Clear recognition job
              </button>
            )}
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}

          {score ? (
            <>
              <ScoreViewer
                followScore={followScore}
                pages={score.pages}
                playing={playing}
                positionSeconds={position}
                timemap={score.timemap}
              />
              <Transport
                duration={score.durationSeconds}
                followScore={followScore}
                muted={muted}
                playing={playing}
                position={position}
                tempo={tempo}
                volume={volume}
                onFollowScore={() => setFollowScore((current) => !current)}
                onMute={() => {
                  const next = !muted;
                  setMuted(next);
                  player.setVolume(next ? -60 : volume);
                }}
                onPlayPause={togglePlayback}
                onSeek={(next) => {
                  player.seek(next);
                  setPosition(next);
                }}
                onStop={stopPlayback}
                onTempo={(next) => {
                  setTempo(next);
                  player.setTempoScale(next);
                }}
                onVolume={(next) => {
                  setVolume(next);
                  setMuted(false);
                  player.setVolume(next);
                }}
              />
            </>
          ) : (
            <div className="empty-score">
              <h2>Open a score to begin</h2>
              <p>Try the demonstration or choose a MusicXML file from the panel.</p>
            </div>
          )}
        </main>
      </div>

      <footer className="app-footer">
        <span>Files stay in your browser or local companion service.</span>
        <a href="https://github.com/Audiveris/audiveris">Audiveris limitations and license</a>
      </footer>
    </div>
  );
}
