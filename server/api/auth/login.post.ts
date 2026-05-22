import { loginSchema } from '../../../shared/schemas/auth.schema'
import { safeCompareSecret, setAdminSession } from '../../utils/auth'
import { parseRequestBody } from '../../utils/request'

export default defineEventHandler(async (event) => {
  const body = await parseRequestBody(event, loginSchema)
  const config = useRuntimeConfig()

  if (body.username !== config.adminUsername || !safeCompareSecret(body.password, config.adminPassword)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid username or password'
    })
  }

  setAdminSession(event, body.username)

  return {
    data: {
      username: body.username
    }
  }
})
