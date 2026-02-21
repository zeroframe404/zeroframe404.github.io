export const ALLOWED_FILE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'application/pdf'
])

export const MAX_SINIESTRO_FILES = 24
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function isAllowedFileMimeType(mimeType: string) {
  return ALLOWED_FILE_MIME_TYPES.has(mimeType)
}

