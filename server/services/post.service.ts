import { and, asc, count, desc, eq, gt, ilike, lt, ne, or, sql } from 'drizzle-orm'
import { posts, type Post } from '../db/schema'
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
  const searchFilter = query.q
    ? or(
        ilike(posts.title, `%${query.q}%`),
        ilike(posts.excerpt, `%${query.q}%`),
        ilike(posts.content, `%${query.q}%`)
      )
    : undefined
  const filters = [
    query.status ? eq(posts.status, query.status) : undefined,
    searchFilter,
    query.tag ? sql`${query.tag} = any(${posts.tags})` : undefined
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

export const listTags = async () => {
  const db = useDb()
  const rows = await db.execute<{
    name: string
    count: string
  }>(sql`
    select tag as name, count(*)::int as count
    from ${posts}, unnest(${posts.tags}) as tag
    where ${posts.status} = 'published'
    group by tag
    order by count desc, tag asc
  `)

  return rows.map((row) => ({
    name: row.name,
    count: Number(row.count)
  }))
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

const navigationSelect = {
  id: posts.id,
  title: posts.title,
  slug: posts.slug,
  updatedAt: posts.updatedAt
} as const

// 上一篇/下一篇：与列表页（按 updatedAt 倒序）的浏览顺序一致。
// prev = 更新更早（列表中靠下），next = 更新更晚（列表中靠上）。
export const getAdjacentPosts = async (post: Post) => {
  const db = useDb()
  const base = and(eq(posts.status, 'published'), ne(posts.id, post.id))

  const [prev] = await db
    .select(navigationSelect)
    .from(posts)
    .where(and(base, lt(posts.updatedAt, post.updatedAt)))
    .orderBy(desc(posts.updatedAt))
    .limit(1)

  const [next] = await db
    .select(navigationSelect)
    .from(posts)
    .where(and(base, gt(posts.updatedAt, post.updatedAt)))
    .orderBy(asc(posts.updatedAt))
    .limit(1)

  return { prev: prev ?? null, next: next ?? null }
}

const tagsArraySql = (tags: string[]) =>
  sql`ARRAY[${sql.join(tags.map((tag) => sql`${tag}`), sql`, `)}]::text[]`

// 相关文章：与当前文章共享至少一个标签，按共享标签数倒序、再按更新时间倒序。
export const getRelatedPosts = async (post: Post, limit = 3) => {
  if (!post.tags.length) {
    return []
  }

  const db = useDb()
  const sharedCountSql = () => sql<number>`(select count(*)::int from unnest(${posts.tags}) as t where t = any(${tagsArraySql(post.tags)}))`

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      updatedAt: posts.updatedAt,
      shared: sharedCountSql()
    })
    .from(posts)
    .where(and(
      eq(posts.status, 'published'),
      ne(posts.id, post.id),
      sql`${posts.tags} && ${tagsArraySql(post.tags)}`
    ))
    .orderBy(desc(sharedCountSql()), desc(posts.updatedAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    updatedAt: row.updatedAt
  }))
}
