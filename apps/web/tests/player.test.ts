import { describe, expect, it, vi } from 'vitest';
import { ScorePlayer } from '../src/lib/audio/player';

describe('ScorePlayer', () => {
  it('cancels future note timers before releasing active notes', () => {
    const clearTimeout = vi.fn();
    const releaseAll = vi.fn();
    const player = new ScorePlayer({ onEnded: vi.fn() });

    Object.assign(player, {
      instrument: { releaseAll },
      scheduledNoteTimers: new Set([4, 8]),
      tone: {
        getContext: () => ({ clearTimeout }),
        now: () => 12.5
      }
    });

    player.stop(false);

    expect(clearTimeout).toHaveBeenNthCalledWith(1, 4);
    expect(clearTimeout).toHaveBeenNthCalledWith(2, 8);
    expect(releaseAll).toHaveBeenCalledWith(12.5);
    expect(clearTimeout.mock.invocationCallOrder[1]).toBeLessThan(releaseAll.mock.invocationCallOrder[0]);
  });
});
