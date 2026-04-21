import { z } from 'zod/v4'

// ─── Response ───

export const EnumItemSchema = z.object({
  code: z.union([z.string(), z.number()]),
  name: z.string(),
})

export type EnumItem = z.infer<typeof EnumItemSchema>

export const EnumListSchema = z.array(EnumItemSchema)
