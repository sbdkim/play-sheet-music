import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScoreViewer } from '../src/features/score-viewer/ScoreViewer';

const pages = ['<svg><g id="old-note"></g><g id="new-note"></g></svg>'];
const timemap = [
  { tstamp: 0, qstamp: 0, on: ['old-note'] },
  { tstamp: 500, qstamp: 1, on: ['new-note'] }
];

describe('ScoreViewer', () => {
  it('highlights notes without scrolling when follow mode is off', () => {
    const { getByLabelText } = render(
      <ScoreViewer
        followScore={false}
        pages={pages}
        playing={true}
        positionSeconds={1}
        timemap={timemap}
      />
    );
    const viewer = getByLabelText('Rendered score');
    const scrollTo = vi.fn();
    Object.defineProperty(viewer, 'scrollTo', { value: scrollTo });

    expect(viewer.querySelector('#old-note')).toHaveClass('is-playing');
    expect(viewer.querySelector('#new-note')).toHaveClass('is-playing');
    expect(viewer.querySelector('#new-note')).toHaveClass('playback-cursor');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('keeps the last-started note visible after its active interval ends', () => {
    const endedTimemap = [
      { tstamp: 0, qstamp: 0, on: ['old-note'] },
      { tstamp: 250, qstamp: 0.5, off: ['old-note'] }
    ];
    const { getByLabelText } = render(
      <ScoreViewer
        followScore={false}
        pages={pages}
        playing={true}
        positionSeconds={1}
        timemap={endedTimemap}
      />
    );

    const viewer = getByLabelText('Rendered score');
    expect(viewer.querySelector('#old-note')).not.toHaveClass('is-playing');
    expect(viewer.querySelector('#old-note')).toHaveClass('playback-cursor');
  });

  it('suspends automatic following after manual wheel input', () => {
    const { getByLabelText, rerender } = render(
      <ScoreViewer
        followScore={true}
        pages={pages}
        playing={true}
        positionSeconds={0}
        timemap={timemap}
      />
    );
    const viewer = getByLabelText('Rendered score');
    const scrollTo = vi.fn();
    Object.defineProperty(viewer, 'scrollTo', { value: scrollTo });
    fireEvent.wheel(viewer);

    rerender(
      <ScoreViewer
        followScore={true}
        pages={pages}
        playing={true}
        positionSeconds={1}
        timemap={timemap}
      />
    );
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
