# Todo

- Add hosted OMR only after cost, authentication, abuse prevention, and AGPL review.
- Evaluate richer General MIDI instrumentation after the piano-first playback path is stable.
- Consider loop regions, metronome, and part mute/solo after core synchronization is reliable.
- Add a recognition-review phase that flags measures with OMR rhythm warnings before playback.
- Flag same-pitch, same-onset voices with conflicting durations for review, especially shared noteheads with stems in both directions. Do not merge them automatically because legitimate divisi/unison voices can carry independent musical meaning.
- Add note-level correction only as a separate product phase for recognition errors that remain after high-resolution PDF preprocessing.
- Validate the Docker Ghostscript rasterization path on a machine with Docker; the equivalent Windows Python path is verified.
