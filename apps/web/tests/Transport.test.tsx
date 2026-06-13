import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Transport } from '../src/features/playback/Transport';

describe('Transport', () => {
  it('exposes playback and seek controls', () => {
    const onPlayPause = vi.fn();
    const onSeek = vi.fn();
    render(
      <Transport
        duration={12}
        followScore={true}
        muted={false}
        playing={false}
        position={3}
        tempo={1}
        volume={-8}
        onMute={vi.fn()}
        onFollowScore={vi.fn()}
        onPlayPause={onPlayPause}
        onSeek={onSeek}
        onStop={vi.fn()}
        onTempo={vi.fn()}
        onVolume={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Play score' }));
    fireEvent.change(screen.getByLabelText('Playback position'), { target: { value: '6' } });
    expect(onPlayPause).toHaveBeenCalledOnce();
    expect(onSeek).toHaveBeenCalledWith(6);
  });
});
