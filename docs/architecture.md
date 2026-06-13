# Architecture

## System Boundary

The browser owns score import, rendering, MIDI generation, playback, and all interaction. The local companion service exists only to convert a PDF into compressed MusicXML.

```text
MusicXML/MXL -> Verovio WASM -> SVG + MIDI + timemap -> Tone.js playback

PDF -> local Fastify API -> Audiveris CLI -> MXL -> browser pipeline above
```

## Frontend

The Vite frontend is deployable as static files. Verovio work runs behind an adapter and may use a worker where browser support and package loading allow it. Tone.js is initialized only after a user gesture.

The playback clock is based on generated MIDI event seconds. Verovio timemap entries provide note IDs for visual highlighting. Tempo changes rescale transport position and rebuild scheduled events.

## OMR Service

The Fastify service binds to localhost by default and accepts one PDF job at a time. Each job has a private directory containing source, output, metadata, and process log files.

Jobs transition through:

```text
queued -> processing -> completed
                     -> failed
any terminal state  -> expired
```

Startup cleanup and an hourly timer delete jobs older than 24 hours.

## Security And Privacy

- PDF size and page count are checked in the browser and service.
- The service permits only configured local origins.
- Detailed Audiveris logs are never returned through the API.
- The service is not designed for public internet exposure.

## Licenses

- Audiveris: AGPL-3.0-or-later
- Verovio: LGPL-3.0
- Tone.js and `@tonejs/midi`: MIT
- Salamander Grand Piano samples: CC BY 3.0
