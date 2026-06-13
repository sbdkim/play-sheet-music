const SCORE_EXTENSIONS = ['.musicxml', '.xml', '.mxl'];

export function isSupportedScoreFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return SCORE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export function getScoreFormat(fileName: string): 'xml' | 'mxl' {
  return fileName.toLowerCase().endsWith('.mxl') ? 'mxl' : 'xml';
}

export async function readScoreFile(file: File) {
  const format = getScoreFormat(file.name);
  return {
    format,
    data: format === 'mxl' ? await file.arrayBuffer() : await file.text()
  } as const;
}

export function validateScoreXml(xml: string) {
  const normalized = xml.toLowerCase();
  if (!normalized.includes('<score-partwise') && !normalized.includes('<score-timewise') && !normalized.includes('<mei')) {
    throw new Error('This XML file does not look like MusicXML or MEI notation.');
  }
}
