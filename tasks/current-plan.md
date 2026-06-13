# Current Plan

## Goal

Build the first complete local and static-deployable version of Play Sheet Music.

## Checklist

- [x] Define architecture and deployment boundaries
- [x] Scaffold npm workspaces and shared contracts
- [x] Implement browser score rendering and playback
- [x] Implement PDF preview and local OMR workflow
- [x] Implement local OMR API, cleanup, and Docker packaging
- [x] Add tests and deployment workflows
- [x] Verify local build and browser behavior

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
- `PAGES_BASE=/play-sheet-music/` produces a valid static build with copied samples, theme tokens, favicon, piano assets, PDF worker, and Verovio worker.
- Playwright Chromium E2E passes for bundled score rendering and static-mode controls.
- Manual Playwright CLI verification covered playback, synchronized position updates, persisted dark mode, and a 390 x 844 mobile viewport.
- The local API tests cover health, CORS preflight, invalid uploads, queued processing, completed results, Unicode result filenames, deletion, expiration, and runner failures.
- Real Audiveris 5.7.0 browser-flow verification on June 13, 2026:
  - `주와 같이 길 가는 것.pdf`: 2 PDF pages -> 3 rendered score pages -> 2:30 playback timeline.
  - `예수는 나의 힘이요.pdf`: 2 PDF pages -> 3 rendered score pages -> 1:48 playback timeline.
  - Both files previewed, queued, produced MXL, rendered through Verovio, played through local piano samples, stopped, and deleted successfully.
- Real-file testing fixed two integration bugs: Unicode filenames now use RFC 5987 response headers, and local CORS explicitly permits `DELETE`.
- Audiveris reported rhythm ambiguities in both files, while Verovio reported incomplete ties/hairpins and one chord/beam import issue in the second result. Playback is available, but recognition accuracy still requires musical review.
- Direct PDF recognition initially misread measure 1 of `주와 같이 길 가는 것.pdf` as dotted quarter + quarter + dotted quarter. Rasterizing PDF pages to 400 DPI grayscale before Audiveris now exports the correct dotted quarter + eighth + dotted quarter + eighth rhythm.
- Score tracking now uses a synchronous layout effect and a 20 FPS playback-position update. One persistent playback cursor remains visible between timing events without requiring scrolling. Follow still uses a safe viewport band, pauses after manual scrolling, and can be disabled; the notation pane scrolls independently while the transport remains pinned.
- Live browser verification on June 13, 2026 confirmed the playback cursor remained present and advanced across distinct note IDs while the page was untouched.
- Pause now clears all future Tone context timers before releasing active notes. Unit and Playwright regression coverage confirm the transport position remains frozen after pause; live verification held at 0.50 seconds for an additional 800 ms.
- In measure 2 of `예수는 나의 힘이요.pdf`, shared noteheads have both upward and downward stems for the Cello 1 and Cello 2 voices in unison. Audiveris correctly creates two logical voices but incorrectly assigns the augmentation dot to only one, exporting overlapping quarter and dotted-quarter durations. This is an OMR voice/dot association error, not a Verovio or playback interpretation error.
- GitHub Pages testing deployment is live at `https://sbdkim.github.io/play-sheet-music/`. CI and deployment workflows pass on GitHub Actions, and deployed browser verification covered subpath assets, sample rendering, playback, and pause.
- The extracted Windows console package had no OCR language packs, so Korean lyrics were not recognized. Docker packaging remains unverified because Docker is not installed on this workstation.
