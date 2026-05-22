import { postListQuerySchema } from '../../../shared/schemas/post.schema'
import { listPosts } from '../../services/post.service'
import { parseRequestQuery } from '../../utils/request'

export default defineEventHandler(async (event) => {
  const query = parseRequestQuery(event, postListQuerySchema)
  const result = await listPosts(query)
  const page = Math.floor(query.offset / query.limit) + 1

  return {
    data: result.data,
    pagination: {
      total: result.total,
      page,
      pageSize: query.limit,
      pageCount: Math.max(1, Math.ceil(result.total / query.limit)),
      limit: query.limit,
      offset: query.offset
    }
  }
})
