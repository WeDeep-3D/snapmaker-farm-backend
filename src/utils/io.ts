import { downloadZip } from 'client-zip';

export async function packToZip(files: File[]) {
  return downloadZip(files, { buffersAreUTF8: true }).blob();
}
