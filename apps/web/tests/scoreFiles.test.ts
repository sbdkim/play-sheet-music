import { describe, expect, it } from 'vitest';
import { getScoreFormat, isSupportedScoreFile, validateScoreXml } from '../src/lib/scoreFiles';

describe('score file validation', () => {
  it('recognizes supported extensions', () => {
    expect(isSupportedScoreFile(new File([''], 'score.musicxml'))).toBe(true);
    expect(isSupportedScoreFile(new File([''], 'score.mxl'))).toBe(true);
    expect(isSupportedScoreFile(new File([''], 'score.pdf'))).toBe(false);
  });

  it('selects compressed and text formats', () => {
    expect(getScoreFormat('score.mxl')).toBe('mxl');
    expect(getScoreFormat('score.musicxml')).toBe('xml');
  });

  it('rejects unrelated XML', () => {
    expect(() => validateScoreXml('<document />')).toThrow(/MusicXML/);
    expect(() => validateScoreXml('<score-partwise version="4.0" />')).not.toThrow();
  });
});
