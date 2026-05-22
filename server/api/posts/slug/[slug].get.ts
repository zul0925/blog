import { getPostBySlug } from '../../../services/post.service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'slug 不能为空'
    })
  }

  const data = await getPostBySlug(slug)

  return {
    data
  }
})
