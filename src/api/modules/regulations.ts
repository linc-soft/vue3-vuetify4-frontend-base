import type { FileMetadata } from '@/api/modules/file'
import type { Result } from '@/api/types'
import http from '@/api/client'

export interface RegulationsFileResponse {
  id: number
  originalFilename: string
  fileType: number
  dateUrl: string
  storedName: string
  contentType: string
  size: number
  uploader: string
  uploadDate: string
}

/** POST /api/regulations/upload — Upload a regulations file */
export async function uploadRegulations(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<FileMetadata> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await http.post<Result<FileMetadata>>('/api/regulations/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return data.data
}

/** GET /api/regulations/list — List all regulations files */
export async function getRegulationsList(): Promise<RegulationsFileResponse[]> {
  const { data } = await http.get<Result<RegulationsFileResponse[]>>('/api/regulations/list')
  return data.data
}
