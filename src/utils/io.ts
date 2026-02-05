import { downloadZip, makeZip } from 'client-zip'

export function packToZip(files: File[]) {
  return downloadZip(files, { buffersAreUTF8: true }).blob()
}

export function packToZipStream(files: Parameters<typeof downloadZip>[0]) {
  // Stream the zip so the client can start downloading immediately.
  return makeZip(files, { buffersAreUTF8: true })
}
