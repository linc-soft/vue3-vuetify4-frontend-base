import { z } from 'zod/v4'

// ─── Response ───

export const EnumItemSchema = z.object({
  code: z.union([z.string(), z.number()]),
  name: z.string(),
})

export type EnumItem = z.infer<typeof EnumItemSchema>

export const EnumListSchema = z.array(EnumItemSchema)

export const SelectOptionSchema = z.object({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
})

export type SelectOption = z.infer<typeof SelectOptionSchema>

export const SelectOptionListSchema = z.array(SelectOptionSchema)
