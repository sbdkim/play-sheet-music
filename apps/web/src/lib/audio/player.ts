import type { Midi } from '@tonejs/midi';
import type { PolySynth, Sampler } from 'tone';

export interface PlayerCallbacks {
  onEnded: () => void;
}

export class ScorePlayer {
  private tone: typeof import('tone') | null = null;
  private instrument: PolySynth | Sampler | null = null;
  private midi: Midi | null = null;
  private callbacks: PlayerCallbacks;
  private position = 0;
  private startedAt = 0;
  private tempoScale = 1;
  private timer: number | null = null;
  private scheduledNoteTimers = new Set<number>();
  private playing = false;
  private volume = -8;

  constructor(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks;
  }

  async initialize() {
    const Tone = this.tone ?? await import('tone');
    this.tone = Tone;
    await Tone.start();
    if (!this.instrument) {
      const fallback = () => {
        this.instrument?.dispose();
        this.instrument = new Tone.PolySynth(Tone.Synth, {
          envelope: { attack: 0.01, decay: 0.25, sustain: 0.35, release: 0.8 },
          oscillator: { type: 'triangle8' }
        }).toDestination();
        this.instrument.volume.value = this.volume;
      };

      try {
        this.instrument = await new Promise<Sampler>((resolve, reject) => {
          const sampler = new Tone.Sampler({
            urls: {
              A1: 'A1.mp3',
              C3: 'C3.mp3',
              'D#4': 'Ds4.mp3',
              'F#5': 'Fs5.mp3'
            },
            baseUrl: `${import.meta.env.BASE_URL}audio/piano/`,
            release: 1.2,
            onload: () => resolve(sampler),
            onerror: reject
          }).toDestination();
        });
        this.instrument.volume.value = this.volume;
      } catch {
        fallback();
      }
    }
  }

  setMidi(midi: Midi) {
    this.stop();
    this.midi = midi;
  }

  setTempoScale(scale: number) {
    const wasPlaying = this.playing;
    const current = this.getPosition();
    this.stop(false);
    this.position = current;
    this.tempoScale = scale;
    if (wasPlaying) {
      void this.play();
    }
  }

  setVolume(decibels: number) {
    this.volume = decibels;
    if (this.instrument) {
      this.instrument.volume.value = decibels;
    }
  }

  async play() {
    if (!this.midi) {
      return;
    }
    await this.initialize();
    const Tone = this.tone;
    if (!Tone) {
      return;
    }
    this.stop(false);
    this.playing = true;
    const startDelay = 0.08;
    this.startedAt = Tone.now() + startDelay - this.position / this.tempoScale;
    const context = Tone.getContext();

    for (const track of this.midi.tracks) {
      for (const note of track.notes) {
        const noteStart = note.time / this.tempoScale;
        const noteEnd = (note.time + note.duration) / this.tempoScale;
        if (noteEnd <= this.position / this.tempoScale) {
          continue;
        }
        const relativeStart = Math.max(0, noteStart - this.position / this.tempoScale);
        const duration = Math.max(0.04, noteEnd - Math.max(noteStart, this.position / this.tempoScale));
        let noteTimer = 0;
        noteTimer = context.setTimeout(() => {
          this.scheduledNoteTimers.delete(noteTimer);
          if (!this.playing) return;
          this.instrument?.triggerAttackRelease(
            note.name,
            duration,
            undefined,
            Math.max(0.12, note.velocity)
          );
        }, startDelay + relativeStart);
        this.scheduledNoteTimers.add(noteTimer);
      }
    }

    const remainingMs = Math.max(0, (this.getDuration() - this.position) / this.tempoScale * 1000);
    this.timer = window.setTimeout(() => {
      this.playing = false;
      this.position = 0;
      this.callbacks.onEnded();
    }, remainingMs + 100);
  }

  pause() {
    if (!this.playing) {
      return;
    }
    this.position = this.getPosition();
    this.stop(false);
  }

  stop(reset = true) {
    const stopAt = this.tone?.now();
    const context = this.tone?.getContext();
    if (context) {
      for (const noteTimer of this.scheduledNoteTimers) {
        context.clearTimeout(noteTimer);
      }
    }
    this.scheduledNoteTimers.clear();
    this.instrument?.releaseAll(stopAt);
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.playing = false;
    if (reset) {
      this.position = 0;
    }
  }

  seek(seconds: number) {
    const wasPlaying = this.playing;
    this.stop(false);
    this.position = Math.max(0, Math.min(seconds, this.getDuration()));
    if (wasPlaying) {
      void this.play();
    }
  }

  getPosition() {
    if (!this.playing) {
      return this.position;
    }
    return Math.max(
      0,
      Math.min(((this.tone?.now() ?? this.startedAt) - this.startedAt) * this.tempoScale, this.getDuration())
    );
  }

  getDuration() {
    return this.midi?.duration ?? 0;
  }

  isPlaying() {
    return this.playing;
  }

  dispose() {
    this.stop();
    this.instrument?.dispose();
    this.instrument = null;
  }
}
