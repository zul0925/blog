import { postCreateSchema } from '../../../shared/schemas/post.schema'
import { createPost } from '../../services/post.service'
import { requireAdminSession } from '../../utils/auth'
import { parseRequestBody } from '../../utils/request'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const body = await parseRequestBody(event, postCreateSchema)
  const data = await createPost(body)

  setResponseStatus(event, 201)

  return {
    data
  }
})
