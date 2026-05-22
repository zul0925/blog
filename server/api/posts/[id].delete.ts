import { deletePost } from '../../services/post.service'
import { requireAdminSession } from '../../utils/auth'
import { getNumericRouterParam } from '../../utils/request'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const id = getNumericRouterParam(event, 'id')
  const data = await deletePost(id)

  return {
    data
  }
})
