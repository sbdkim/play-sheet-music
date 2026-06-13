# Deployment

## GitHub Pages Testing

Testing URL: <https://sbdkim.github.io/play-sheet-music/>

```powershell
$env:PAGES_BASE='/play-sheet-music/'
npm --workspace @play-sheet-music/web run build
```

Publish `apps/web/dist`. This deployment supports samples and MusicXML/MXL import. PDF recognition requires a local companion service and may be unavailable from an HTTPS page because browsers block insecure localhost integrations differently.

## Vercel Production

- Root directory: repository root
- Build command: `npm run build`
- Output directory: `apps/web/dist`
- Environment: `VERCEL=1`
- Production alias: `shinbum-play-sheet-music.vercel.app`

Do not configure an OMR API URL for production until a secured worker exists.
