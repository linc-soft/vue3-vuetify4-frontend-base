import type { Result } from '@/api/types'
import http from '@/api/client'

export interface FileMetadata {
  id: number | null
  storedName: string
  originalFilename: string
  datePath: string
  dateUrl: string
  size: number
  contentType: string
  md5: string
}

/** POST /api/common/files - Upload a single file */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<FileMetadata> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await http.post<Result<FileMetadata>>('/api/common/files', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return data.data
}

/** POST /api/common/files/batch - Upload multiple files */
export async function uploadFiles(
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<FileMetadata[]> {
  const form = new FormData()
  for (const f of files) form.append('files', f)

  const { data } = await http.post<Result<FileMetadata[]>>('/api/common/files/batch', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return data.data
}

/** GET /api/common/files/{dateUrl}/{storedName} - Download a file as blob */
export async function downloadFile(
  dateUrl: string,
  storedName: string,
): Promise<{ blob: Blob; md5Header: string | null }> {
  const response = await http.get<Blob>(`/api/common/files/${dateUrl}/${storedName}`, {
    responseType: 'blob',
  })
  const md5Header = (response.headers['x-file-md5'] as string) ?? null
  return { blob: response.data, md5Header }
}

/** DELETE /api/common/files/{dateUrl}/{storedName} - Delete a file */
export async function deleteFile(dateUrl: string, storedName: string): Promise<void> {
  await http.delete(`/api/common/files/${dateUrl}/${storedName}`)
}
