export function estimatePdfPageCount(buffer: Buffer) {
  const content = buffer.toString('latin1');
  const matches = content.match(/\/Type\s*\/Page(?!s)\b/g);
  return matches?.length ?? 0;
}

export function isPdf(buffer: Buffer) {
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}
