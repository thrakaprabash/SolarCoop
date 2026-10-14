import { randomUUID } from 'expo-crypto';
import { supabase } from '../../lib/supabase';
import { buildJob } from './jobService';
import { readPhotoFile } from '../utils/photoFile';
import { MAX_PHOTO_BYTES, REPAIR_PHOTO_BUCKET, validateRepairPhoto } from '../utils/repairPhoto';

export async function uploadRepairPhoto(job, technicianId, asset) {
  if (job.status !== 'active' || job.technicianId !== technicianId) {
    throw new Error('Only the assigned technician can add photos to an active job.');
  }
  if (asset.fileSize > MAX_PHOTO_BYTES) throw new Error('Choose a photo no larger than 10 MB.');
  const buffer = await readPhotoFile(asset);
  const { contentType, extension } = validateRepairPhoto(buffer);
  const path = `${job.id}/${randomUUID()}.${extension}`;
  const bucket = supabase.storage.from(REPAIR_PHOTO_BUCKET);
  const { error: uploadError } = await bucket.upload(path, buffer, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.rpc('attach_job_repair_photo', {
    p_job_id: job.id, p_path: path,
  }).single();
  if (error) {
    // The delete policy preserves a photo if the RPC committed but its response was lost.
    await bucket.remove([path]).catch(() => {});
    throw error;
  }
  return buildJob(data);
}

export async function getRepairPhotoUrl(path) {
  const { data, error } = await supabase.storage.from(REPAIR_PHOTO_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
