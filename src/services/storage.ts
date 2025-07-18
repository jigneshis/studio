'use server';

import {supabase} from '@/lib/supabase';
import {v4 as uuidv4} from 'uuid';

function dataUriToBuffer(dataUri: string): Buffer {
  const base64 = dataUri.split(',')[1];
  if (!base64) {
    throw new Error('Invalid data URI');
  }
  return Buffer.from(base64, 'base64');
}

function getMimeType(dataUri: string): string {
  const mime = dataUri.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  if (mime && mime.length > 1) {
    return mime[1];
  }
  return 'application/octet-stream';
}

export async function uploadImage(
  dataUri: string,
  bucket: string,
): Promise<string> {
  const buffer = dataUriToBuffer(dataUri);
  const mimeType = getMimeType(dataUri);
  const extension = mimeType.split('/')[1] || 'png';
  const filePath = `${uuidv4()}.${extension}`;

  const {error} = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image to ${bucket}: ${error.message}`);
  }

  const {
    data: {publicUrl},
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}
