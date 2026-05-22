import { requireAdminSession } from '../../utils/auth'

export default defineEventHandler((event) => {
  const session = requireAdminSession(event)

  return {
    data: {
      authenticated: true,
      username: session.username,
      expiresAt: session.exp
    }
  }
})
