import type { EnumItem } from '@/api/schemas/common'
import type { Result } from '@/api/types'
import http from '@/api/client'
import { EnumListSchema } from '@/api/schemas/common'

/** GET /api/common/enums?type={type} */
export async function getEnums(type: string): Promise<EnumItem[]> {
  const { data } = await http.get<Result<EnumItem[]>>('/api/common/enums', {
    params: { type },
  })
  return EnumListSchema.parse(data.data)
}
