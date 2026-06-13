import { useLayoutEffect, useRef } from 'react';
import type { TimemapEntry } from '../../types/score';

interface ScoreViewerProps {
  followScore: boolean;
  pages: string[];
  playing: boolean;
  positionSeconds: number;
  timemap: TimemapEntry[];
}

function getPlaybackTarget(timemap: TimemapEntry[], positionSeconds: number) {
  const milliseconds = positionSeconds * 1000;
  const active = new Set<string>();
  let focusId: string | null = null;
  for (const entry of timemap) {
    if (entry.tstamp > milliseconds) {
      break;
    }
    entry.off?.forEach((id) => active.delete(id));
    entry.on?.forEach((id) => {
      active.add(id);
      focusId = id;
    });
  }
  return { active, focusId };
}

export function ScoreViewer({
  followScore,
  pages,
  playing,
  positionSeconds,
  timemap
}: ScoreViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastFocusIdRef = useRef<string | null>(null);
  const manualScrollUntilRef = useRef(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    root.querySelectorAll('.is-playing, .playback-cursor').forEach((element) => {
      element.classList.remove('is-playing', 'playback-cursor');
    });
    const { active, focusId } = getPlaybackTarget(timemap, positionSeconds);
    for (const id of active) {
      const element = root.querySelector(`[id="${CSS.escape(id)}"]`);
      if (element) {
        element.classList.add('is-playing');
      }
    }
    if (playing && focusId) {
      root.querySelector(`[id="${CSS.escape(focusId)}"]`)?.classList.add('playback-cursor');
    }

    if (
      !playing ||
      !followScore ||
      !focusId ||
      focusId === lastFocusIdRef.current ||
      Date.now() < manualScrollUntilRef.current
    ) {
      return;
    }
    lastFocusIdRef.current = focusId;

    const focusElement = root.querySelector(`[id="${CSS.escape(focusId)}"]`);
    if (!focusElement) {
      return;
    }
    const rootRect = root.getBoundingClientRect();
    const focusRect = focusElement.getBoundingClientRect();
    const safeTop = rootRect.top + rootRect.height * 0.2;
    const safeBottom = rootRect.top + rootRect.height * 0.72;
    if (focusRect.top < safeTop || focusRect.bottom > safeBottom) {
      root.scrollTo({
        top: root.scrollTop + focusRect.top - rootRect.top - rootRect.height * 0.35,
        behavior: 'auto'
      });
    }
  }, [followScore, playing, positionSeconds, timemap]);

  function pauseFollowForManualScroll() {
    manualScrollUntilRef.current = Date.now() + 4_000;
  }

  return (
    <div
      className="score-viewport"
      ref={rootRef}
      aria-label="Rendered score"
      onPointerDown={pauseFollowForManualScroll}
      onTouchStart={pauseFollowForManualScroll}
      onWheel={pauseFollowForManualScroll}
    >
      {pages.map((svg, index) => (
        <div
          className="score-page"
          key={`${index}-${svg.length}`}
          aria-label={`Score page ${index + 1}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ))}
    </div>
  );
}
