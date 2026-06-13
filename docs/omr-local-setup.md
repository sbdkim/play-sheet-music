# Local OMR Setup

PDF recognition is optional. Samples and MusicXML/MXL import work without it.

## Docker Path

Install Docker Desktop, then run:

```powershell
docker compose up --build omr-api
```

The container downloads the pinned Audiveris release during its image build and exposes the API only on `127.0.0.1:8787`.

## Existing Audiveris Installation

Set `AUDIVERIS_COMMAND` to a command template containing:

- `{input}` for the source PDF
- `{outputDir}` for the job output directory

Example:

```powershell
$env:AUDIVERIS_COMMAND='C:\Tools\Audiveris\bin\Audiveris.bat -batch -export -output "{outputDir}" "{input}"'
npm run dev:omr
```

The service searches the output directory for the generated `.mxl` file.

For vector PDFs with small flags or beams, configure 400 DPI grayscale
preprocessing before Audiveris:

```powershell
python -m pip install pymupdf pillow
$env:PDF_RASTERIZE_COMMAND='python "C:\Users\KRSBK\Documents\Projects\github-projects\play-sheet-music\scripts\rasterize-pdf.py" "{input}" "{output}"'
```

`PDF_RASTERIZE_COMMAND` accepts `{input}` and `{output}` placeholders. If it is
unset, Audiveris receives the original PDF directly. The Docker image uses
Ghostscript to produce the same 400 DPI multipage grayscale TIFF.

Audiveris's Windows console MSI includes its own Java runtime. It can also be
administratively extracted to a local tools folder and referenced by
`AUDIVERIS_COMMAND`, avoiding a system-wide Java installation.

## Test Adapter

For API development without Java or Docker, set `OMR_FAKE_RESULT_PATH` to an existing `.mxl` fixture. The service copies that file instead of invoking Audiveris.

## Limitations

Audiveris targets printed common Western music notation. Recognition is imperfect and handwritten scores are unsupported.

Text recognition requires suitable Tesseract language data. A default console
installation may recognize notation while omitting Korean lyrics. Audiveris can
also export structurally imperfect MusicXML when rhythms, ties, hairpins, or
chords are ambiguous; Verovio may still render and play the result, but users
should review it in a notation editor.
