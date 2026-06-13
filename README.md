# Play Sheet Music

Turn MusicXML into an interactive score with synchronized browser playback, with optional local PDF recognition for clean printed sheet music.

## Deployment Status

- Local development supports PDF recognition through the companion OMR service.
- GitHub Pages is the testing deploy for static score import and playback:
  [sbdkim.github.io/play-sheet-music](https://sbdkim.github.io/play-sheet-music/)
- Vercel is the planned production host at `https://shinbum-play-sheet-music.vercel.app/`.

## Key Features

- Load bundled demonstration scores
- Import `.musicxml`, `.xml`, and compressed `.mxl` files
- Render responsive notation and synchronized playback in the browser
- Play, pause, stop, seek, change tempo, adjust volume, and mute
- Preview PDFs and submit them to an optional local Audiveris service
- Keep user files local with automatic 24-hour cleanup in the companion service

## Tech Stack

- React 19, TypeScript, and Vite
- Verovio WebAssembly
- Tone.js and `@tonejs/midi`
- PDF.js
- Fastify local OMR API
- Audiveris as an external AGPL-licensed recognition engine

## Setup / Run Locally

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. The local OMR API runs at `http://127.0.0.1:8787`.

PDF recognition additionally requires Docker or a local Audiveris installation. See [`docs/omr-local-setup.md`](docs/omr-local-setup.md).

## Tests

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Deployment Notes

- GitHub Pages testing builds use `PAGES_BASE=/play-sheet-music/`.
- Vercel builds use `/` as the asset base.
- Public deployments do not host Audiveris and remain fully usable for sample and MusicXML/MXL playback.
- Set `VITE_OMR_API_URL` only when a trusted local or future secured OMR endpoint is available.

## Theme / UI Notes

- The app uses the Northline product-family theme.
- First visit defaults to light mode; a manual preference persists in `localStorage`.
- The interface is an application workspace rather than a marketing landing page.

## Privacy And Limits

- Browser-imported scores are not uploaded.
- PDFs are sent only to the configured local OMR service.
- Local OMR files expire after 24 hours.
- Recognition targets printed common Western notation. Handwritten and unusual notation are unsupported.
- OMR is imperfect; download the generated MXL for review in a notation editor when necessary.

## License

Application code is MIT. Third-party engines, libraries, and sample assets retain their own licenses. See [`docs/architecture.md`](docs/architecture.md).
