export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const REPAIR_PHOTO_BUCKET = 'repair-evidence';

// Check the bytes as well as the picker metadata: file names can be misleading.
export function validateRepairPhoto(buffer) {
  const bytes = new Uint8Array(buffer);
  if (!bytes.length) throw new Error('This photo is empty. Choose another photo.');
  if (bytes.length > MAX_PHOTO_BYTES) throw new Error('Choose a photo no larger than 10 MB.');
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const pngHeader = [137, 80, 78, 71, 13, 10, 26, 10];
  const png = bytes.length >= 8 && pngHeader.every((byte, i) => bytes[i] === byte);
  if (!jpeg && !png) throw new Error('Choose a JPG or PNG photo.');
  return { contentType: png ? 'image/png' : 'image/jpeg', extension: png ? 'png' : 'jpg', size: bytes.length };
}
