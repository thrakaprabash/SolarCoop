import { File } from 'expo-file-system';
import { MAX_PHOTO_BYTES } from './repairPhoto';

export async function readPhotoFile(asset) {
  const file = new File(asset.uri);
  if (file.size > MAX_PHOTO_BYTES) throw new Error('Choose a photo no larger than 10 MB.');
  return file.arrayBuffer();
}
