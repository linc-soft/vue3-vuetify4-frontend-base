import type { Result } from '@/api/types'
import http, { getAccessToken } from '@/api/client'
import {
  CreateExportTaskResponseSchema,
  type ExportTask,
  ExportTaskSchema,
  type LogExportRequest,
} from '@/api/schemas/exportTask'

export async function createExportTask(params: LogExportRequest): Promise<{ taskId: string }> {
  const { data } = await http.post<Result>('/api/tasks/export-logs', params)
  return CreateExportTaskResponseSchema.parse(data.data)
}

export async function downloadExportTask(taskId: string): Promise<Blob> {
  const token = getAccessToken()
  const { data } = await http.get<Blob>(`/api/tasks/${taskId}/download`, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export async function getExportTask(taskId: string): Promise<ExportTask> {
  const { data } = await http.get<Result>(`/api/tasks/${taskId}`)
  return ExportTaskSchema.parse(data.data)
}

export async function deleteExportTask(taskId: string): Promise<void> {
  await http.delete(`/api/tasks/${taskId}`)
}
