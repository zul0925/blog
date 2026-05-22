import { z } from 'zod'

export const postStatusSchema = z.enum(['draft', 'published'])

const slugSchema = z
  .string()
  .trim()
  .max(200, 'Slug 不能超过 200 个字符')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能包含小写字母、数字和连字符')

export const postCreateSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(200, '标题不能超过 200 个字符'),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(500, '摘要不能超过 500 个字符').optional().nullable(),
  content: z.string().trim().min(1, '正文不能为空'),
  status: postStatusSchema.default('draft')
})

export const postUpdateSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(200, '标题不能超过 200 个字符').optional(),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(500, '摘要不能超过 500 个字符').optional().nullable(),
  content: z.string().trim().min(1, '正文不能为空').optional(),
  status: postStatusSchema.optional()
}).refine(
  (value) => Object.keys(value).length > 0,
  '至少需要提供一个要更新的字段'
)

export const postListQuerySchema = z.object({
  status: postStatusSchema.optional(),
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})

export type PostCreateInput = z.infer<typeof postCreateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
export type PostListQuery = z.infer<typeof postListQuerySchema>
