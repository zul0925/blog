import { getAdjacentPosts, getPostBySlug, getRelatedPosts } from '../../../services/post.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'slug 不能为空'
    })
  }

  const data = await getPostBySlug(slug)
  const [{ prev, next }, related] = await Promise.all([
    getAdjacentPosts(data),
    getRelatedPosts(data)
  ])

  return {
    data,
    prev,
    next,
    related
  }
})
