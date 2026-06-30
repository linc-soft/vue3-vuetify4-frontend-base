import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type UserCreateRequest,
  type UserDeleteRequest,
  type UserInfoResponse,
  UserInfoResponseSchema,
  type UserListRequest,
  type UserListResponseItem,
  UserListResponseItemSchema,
  type UserPageRequest,
  type UserPageResponseItem,
  UserPageResponseItemSchema,
  type UserUpdateRequest,
} from '@/api/schemas/user'

/** GET /api/master/users/{id} */
export async function getUser(id: number): Promise<UserInfoResponse> {
  const { data } = await http.get<Result<UserInfoResponse>>(`/api/master/users/${id}`)
  return UserInfoResponseSchema.parse(data.data)
}

/** GET /api/master/users */
export async function getUserList(params?: UserListRequest): Promise<UserListResponseItem[]> {
  const { data } = await http.get<Result<UserListResponseItem[]>>('/api/master/users', { params })
  return z.array(UserListResponseItemSchema).parse(data.data)
}

/** GET /api/master/users/page */
export async function getUserPage(params: UserPageRequest): Promise<Page<UserPageResponseItem>> {
  const { data } = await http.get<Result<Page<UserPageResponseItem>>>('/api/master/users/page', {
    params,
  })
  // Validate each item in the records array.
  data.data.records = z.array(UserPageResponseItemSchema).parse(data.data.records)
  return data.data
}

/** POST /api/master/users */
export async function createUser(params: UserCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/master/users', params)
  return data.data
}

/** PUT /api/master/users */
export async function updateUser(params: UserUpdateRequest): Promise<void> {
  await http.put('/api/master/users', params)
}

/** DELETE /api/master/users */
export async function deleteUser(params: UserDeleteRequest): Promise<void> {
  await http.delete('/api/master/users', { data: params })
}
