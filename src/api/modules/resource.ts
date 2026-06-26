import type { Result } from '@/api/types'
import http from '@/api/client'
import {
  type ResourceCreateRequest,
  type ResourceDeleteRequest,
  type ResourceInfoResponse,
  ResourceInfoResponseSchema,
  type ResourceNode,
  ResourceTreeSchema,
  type ResourceUpdateRequest,
} from '@/api/schemas/resource'

export async function getMyResources(): Promise<ResourceNode[]> {
  const { data } = await http.get<Result<ResourceNode[]>>('/api/system/resources/mine')
  return ResourceTreeSchema.parse(data.data)
}

export async function getResourceTree(): Promise<ResourceNode[]> {
  const { data } = await http.get<Result<ResourceNode[]>>('/api/system/resources')
  return ResourceTreeSchema.parse(data.data)
}

export async function getResource(id: number): Promise<ResourceInfoResponse> {
  const { data } = await http.get<Result<ResourceInfoResponse>>(`/api/system/resources/${id}`)
  return ResourceInfoResponseSchema.parse(data.data)
}

export async function createResource(params: ResourceCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/system/resources', params)
  return data.data
}

export async function updateResource(params: ResourceUpdateRequest): Promise<void> {
  await http.put('/api/system/resources', params)
}

export async function deleteResource(params: ResourceDeleteRequest): Promise<void> {
  await http.delete('/api/system/resources', { data: params })
}
