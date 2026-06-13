import { PauseIcon, PlayIcon, StopIcon, VolumeIcon } from '../../components/Icons';

interface TransportProps {
  duration: number;
  followScore: boolean;
  muted: boolean;
  playing: boolean;
  position: number;
  tempo: number;
  volume: number;
  onMute: () => void;
  onFollowScore: () => void;
  onPlayPause: () => void;
  onSeek: (position: number) => void;
  onStop: () => void;
  onTempo: (tempo: number) => void;
  onVolume: (volume: number) => void;
}

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
}

export function Transport(props: TransportProps) {
  return (
    <div className="transport" aria-label="Playback controls">
      <div className="transport-main">
        <button className="icon-button primary" type="button" onClick={props.onPlayPause} aria-label={props.playing ? 'Pause score' : 'Play score'}>
          {props.playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="icon-button" type="button" onClick={props.onStop} aria-label="Stop and return to beginning">
          <StopIcon />
        </button>
        <span className="time-readout">{formatTime(props.position)}</span>
        <input
          className="seek"
          type="range"
          min="0"
          max={Math.max(props.duration, 0.01)}
          step="0.01"
          value={Math.min(props.position, props.duration)}
          onChange={(event) => props.onSeek(Number(event.target.value))}
          aria-label="Playback position"
        />
        <span className="time-readout">{formatTime(props.duration)}</span>
      </div>
      <div className="transport-options">
        <button
          className="follow-button"
          type="button"
          aria-pressed={props.followScore}
          onClick={props.onFollowScore}
        >
          Follow {props.followScore ? 'on' : 'off'}
        </button>
        <label>
          Tempo
          <select value={props.tempo} onChange={(event) => props.onTempo(Number(event.target.value))}>
            {[0.5, 0.65, 0.75, 0.9, 1, 1.1, 1.25, 1.5].map((value) => (
              <option key={value} value={value}>{Math.round(value * 100)}%</option>
            ))}
          </select>
        </label>
        <button className="icon-button" type="button" onClick={props.onMute} aria-label={props.muted ? 'Unmute' : 'Mute'}>
          <VolumeIcon />
        </button>
        <input
          className="volume"
          type="range"
          min="-36"
          max="0"
          value={props.muted ? -36 : props.volume}
          onChange={(event) => props.onVolume(Number(event.target.value))}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
