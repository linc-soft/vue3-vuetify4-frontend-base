import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http, { getAccessToken } from '@/api/client'
import {
  CreateExportTaskResponseSchema,
  type ExportTask,
  type ExportTaskPageRequest,
  type ExportTaskPageResponseItem,
  ExportTaskPageResponseItemSchema,
  ExportTaskSchema,
  type LogExportRequest,
} from '@/api/schemas/exportTask'

export interface UserReportExportRequest {
  username?: string
  groupBy?: string
}

export async function createUserReportExportTask(
  params: UserReportExportRequest,
): Promise<{ taskId: string }> {
  const { data } = await http.post<Result>('/api/tasks/export-user-report', params)
  return CreateExportTaskResponseSchema.parse(data.data)
}

export async function createExportTask(params: LogExportRequest): Promise<{ taskId: string }> {
  const { data } = await http.post<Result>('/api/tasks/export-logs', params)
  return CreateExportTaskResponseSchema.parse(data.data)
}

export async function getExportTaskPage(
  params: ExportTaskPageRequest,
): Promise<Page<ExportTaskPageResponseItem>> {
  const { data } = await http.get<Result<Page<ExportTaskPageResponseItem>>>('/api/tasks', {
    params,
  })
  data.data.records = z.array(ExportTaskPageResponseItemSchema).parse(data.data.records)
  return data.data
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

export async function deleteExportTasks(taskIds: string[]): Promise<void> {
  await http.delete('/api/tasks', { data: { taskIds } })
}
