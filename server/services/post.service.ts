import { and, count, desc, eq, ilike, ne, sql } from 'drizzle-orm'
import { posts } from '../db/schema'
import { useDb } from '../db'
import type { PostCreateInput, PostListQuery, PostUpdateInput } from '../../shared/schemas/post.schema'

const notFoundError = () =>
  createError({
    statusCode: 404,
    statusMessage: '文章不存在'
  })

const conflictError = () =>
  createError({
    statusCode: 409,
    statusMessage: 'Slug 已存在'
  })

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && error.code === '23505'

const slugify = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)

  return slug || `post-${Date.now()}`
}

const createUniqueSlug = async (title: string, preferredSlug?: string, excludeId?: number) => {
  const db = useDb()
  const baseSlug = preferredSlug || slugify(title)

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`
    const filters = [
      eq(posts.slug, candidate),
      excludeId ? ne(posts.id, excludeId) : undefined
    ].filter(Boolean)

    const [existingPost] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(...filters))
      .limit(1)

    if (!existingPost) {
      return candidate
    }
  }

  return `${baseSlug}-${Date.now()}`
}

export const listPosts = async (query: PostListQuery) => {
  const db = useDb()
  const filters = [
    query.status ? eq(posts.status, query.status) : undefined,
    query.q ? ilike(posts.title, `%${query.q}%`) : undefined
  ].filter(Boolean)

  const where = filters.length ? and(...filters) : undefined

  const [totalResult] = await db
    .select({ total: count() })
    .from(posts)
    .where(where)

  const data = await db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.updatedAt))
    .limit(query.limit)
    .offset(query.offset)

  return {
    data,
    total: totalResult?.total ?? 0
  }
}

export const getPostById = async (id: number) => {
  const db = useDb()
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1)

  if (!post) {
    throw notFoundError()
  }

  return post
}

export const getPostBySlug = async (slug: string) => {
  const db = useDb()
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1)

  if (!post) {
    throw notFoundError()
  }

  return post
}

export const createPost = async (input: PostCreateInput) => {
  const db = useDb()
  const slug = await createUniqueSlug(input.title, input.slug)

  try {
    const [post] = await db.insert(posts).values({
      ...input,
      slug
    }).returning()
    return post
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflictError()
    }

    throw error
  }
}

export const updatePost = async (id: number, input: PostUpdateInput) => {
  const db = useDb()
  const currentPost = await getPostById(id)
  const nextTitle = input.title ?? currentPost.title
  const nextSlug = input.slug
    ? await createUniqueSlug(nextTitle, input.slug, id)
    : currentPost.slug

  try {
    const [post] = await db
      .update(posts)
      .set({
        ...input,
        slug: nextSlug,
        updatedAt: sql`now()`
      })
      .where(eq(posts.id, id))
      .returning()

    if (!post) {
      throw notFoundError()
    }

    return post
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflictError()
    }

    throw error
  }
}

export const deletePost = async (id: number) => {
  const db = useDb()
  const [post] = await db.delete(posts).where(eq(posts.id, id)).returning()

  if (!post) {
    throw notFoundError()
  }

  return post
}
