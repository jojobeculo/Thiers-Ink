/**
 * Identifie une image par sa signature binaire, sans se fier au type ni à
 * l'extension annoncés par le navigateur.
 */
const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']);

export type ImageKind = { mime: string; ext: string };

export function detectImage(bytes: Uint8Array): ImageKind | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (bytes.length >= 12 && ascii(4, 8) === 'ftyp' && HEIF_BRANDS.has(ascii(8, 12))) {
    return { mime: 'image/heic', ext: 'heic' };
  }
  return null;
}
