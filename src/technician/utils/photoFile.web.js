import { MAX_PHOTO_BYTES } from './repairPhoto';

export async function readPhotoFile(asset) {
  if (!asset.file) throw new Error('Could not read this photo. Please select it again.');
  if (asset.file.size > MAX_PHOTO_BYTES) throw new Error('Choose a photo no larger than 10 MB.');
  return asset.file.arrayBuffer();
}
