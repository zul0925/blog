import { postUpdateSchema } from '../../../shared/schemas/post.schema'
import { updatePost } from '../../services/post.service'
import { requireAdminSession } from '../../utils/auth'
import { getNumericRouterParam, parseRequestBody } from '../../utils/request'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const id = getNumericRouterParam(event, 'id')
  const body = await parseRequestBody(event, postUpdateSchema)
  const data = await updatePost(id, body)

  return {
    data
  }
})
