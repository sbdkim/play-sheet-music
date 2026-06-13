# Project Memory

## Product

- Product name: Play Sheet Music
- Repository slug: `play-sheet-music`
- Production target: `https://shinbum-play-sheet-music.vercel.app/`
- Public testing target: GitHub Pages under `/play-sheet-music/`
- Brand family: Northline product shell

## Stable Decisions

- React, TypeScript, and Vite power the static frontend.
- Verovio renders MusicXML/MXL, generates MIDI, and provides timing maps.
- Tone.js schedules playback; `@tonejs/midi` parses generated MIDI.
- Public deployments support bundled samples and MusicXML/MXL import.
- PDF recognition requires a local Fastify companion service.
- Audiveris runs as an external process and is not bundled into the Node service source.
- Uploaded PDFs and generated artifacts expire after 24 hours.
- Version one does not include accounts, cloud storage, note editing, or handwritten score recognition.

## Licensing

- Application code is MIT.
- Audiveris is AGPL-3.0-or-later and remains an external local dependency.
- Verovio is LGPL-3.0.
- Tone.js and `@tonejs/midi` are MIT.
- Salamander Grand Piano samples require CC BY 3.0 attribution.
