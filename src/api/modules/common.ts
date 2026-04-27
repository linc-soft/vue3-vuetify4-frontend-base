import type { EnumItem, SelectOption } from '@/api/schemas/common'
import type { Result } from '@/api/types'
import http from '@/api/client'
import { EnumListSchema, SelectOptionListSchema } from '@/api/schemas/common'

/** GET /api/common/enums?type={type} */
export async function getEnums(type: string): Promise<EnumItem[]> {
  const { data } = await http.get<Result<EnumItem[]>>('/api/common/enums', {
    params: { type },
  })
  return EnumListSchema.parse(data.data)
}

/** GET /api/common/select-options?type={type} */
export async function getSelectOptions(type: string): Promise<SelectOption[]> {
  const { data } = await http.get<Result<SelectOption[]>>('/api/common/select-options', {
    params: { type },
  })
  return SelectOptionListSchema.parse(data.data)
}
